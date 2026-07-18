// CLI entrypoint of the Workflow Engine — how Claude Code and GitHub Actions
// routines drive the pipeline. All executions go through the Task Queue so
// runs, resumes and retries share one orchestration path.
//
//   npm run pipeline -- run --slug <slug> [--category Mugs] [--title "…"] [--dry-run]
//   npm run pipeline -- run-all --dry-run          # every fiche under Products/
//   npm run pipeline -- resume --workflow <wf_id>
//   npm run pipeline -- retry --workflow <wf_id>
//   npm run pipeline -- worker                     # drain the task queue
//   npm run pipeline -- status

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createEngine } from "./pipeline.ts";
import { TaskQueue } from "./queue.ts";
import { createProductObject } from "./product-object.ts";
import { listingRelPath } from "./listing-bridge.ts";

const repoRoot = resolve(import.meta.dirname, "../../..");
const stateDir = join(repoRoot, "Core/state");

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}
function opt(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

async function listingMeta(relPath: string): Promise<{ title: string; category: string } | null> {
  try {
    const raw = await readFile(join(repoRoot, relPath), "utf8");
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    const title = fm.match(/^title_etsy:\s*"?(.+?)"?\s*$/m)?.[1] ?? relPath;
    const category = fm.match(/^category:\s*"?(.+?)"?\s*$/m)?.[1] ?? "Unknown";
    return { title, category };
  } catch {
    return null;
  }
}

async function allListingSlugs(): Promise<{ slug: string; category: string }[]> {
  const out: { slug: string; category: string }[] = [];
  const products = join(repoRoot, "Products");
  for (const category of await readdir(products)) {
    const dir = join(products, category, "Listings");
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }
    for (const f of files.filter((f) => f.endsWith(".md")).sort()) {
      out.push({ slug: f.replace(/\.md$/, ""), category });
    }
  }
  return out;
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const { engine, state, events } = createEngine(repoRoot, stateDir);
  await state.init();
  const queue = new TaskQueue(state.queueDir);
  const dryRun = flag("dry-run");

  events.on("*", (e) => {
    const bits = [e.type, e.workflowId, e.step].filter(Boolean).join(" ");
    console.log(`  ${e.at} ${bits}`);
  });

  async function processQueue(): Promise<void> {
    for (let task = await queue.claim(); task; task = await queue.claim()) {
      try {
        if (task.kind === "run-pipeline") {
          const { slug, category, title, dryRun } = task.payload as {
            slug: string; category: string; title: string; dryRun: boolean;
          };
          const existing = (await state.listProducts()).find((p) => p.slug === slug);
          const product =
            existing ??
            createProductObject({ slug, title, category, listingPath: listingRelPath(category, slug) });
          const wf = await engine.start(product, { dryRun });
          await engine.run(wf.id);
        } else if (task.kind === "resume-workflow" || task.kind === "retry-step") {
          const { workflowId } = task.payload as { workflowId: string };
          if (task.kind === "retry-step") await engine.retry(workflowId);
          else await engine.run(workflowId);
        } else {
          throw new Error(`Unhandled task kind: ${task.kind}`);
        }
        await queue.complete(task.id);
      } catch (err) {
        await queue.fail(task.id, err instanceof Error ? err.message : String(err));
      }
    }
    await state.rebuildIndex();
  }

  switch (command) {
    case "run": {
      const slug = opt("slug");
      if (!slug) throw new Error("run requires --slug");
      let category = opt("category");
      let title = opt("title");
      const fromFiche = category ? null : await listingMeta(listingRelPath(category ?? "", slug));
      if (!category || !title) {
        for (const c of await allListingSlugs()) {
          if (c.slug === slug) {
            category = category ?? c.category;
            const m = await listingMeta(listingRelPath(c.category, slug));
            title = title ?? m?.title ?? slug;
          }
        }
      }
      void fromFiche;
      if (!category) throw new Error(`No fiche found for ${slug}; pass --category and --title`);
      await queue.enqueue("run-pipeline", { slug, category, title: title ?? slug, dryRun });
      await processQueue();
      break;
    }
    case "run-all": {
      for (const { slug, category } of await allListingSlugs()) {
        const m = await listingMeta(listingRelPath(category, slug));
        await queue.enqueue("run-pipeline", { slug, category, title: m?.title ?? slug, dryRun });
      }
      await processQueue();
      break;
    }
    case "resume": {
      const workflowId = opt("workflow");
      if (!workflowId) throw new Error("resume requires --workflow");
      await queue.enqueue("resume-workflow", { workflowId });
      await processQueue();
      break;
    }
    case "retry": {
      const workflowId = opt("workflow");
      if (!workflowId) throw new Error("retry requires --workflow");
      await queue.enqueue("retry-step", { workflowId });
      await processQueue();
      break;
    }
    case "worker": {
      await processQueue();
      break;
    }
    case "status": {
      const index = await state.rebuildIndex();
      console.log(JSON.stringify(index, null, 2));
      break;
    }
    default:
      console.error("Usage: pipeline <run|run-all|resume|retry|worker|status> [options]");
      process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
