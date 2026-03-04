import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://edinc.github.io",
  base: "/octo-eshop-demo",
  integrations: [
    starlight({
      title: "Octo E-Shop Demos",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/edinc/octo-eshop-demo",
        },
      ],
      sidebar: [
        { label: "Getting Started", slug: "getting-started" },
        {
          label: "Demos",
          items: [
            { label: "Plan Agent", slug: "demos/01-plan-agent" },
            { label: "Agents HQ", slug: "demos/02-agents-hq" },
            { label: "Coding Agent", slug: "demos/03-coding-agent" },
            { label: "Review Agent", slug: "demos/04-review-agent" },
            { label: "Custom Agents", slug: "demos/05-custom-agents" },
            { label: "Custom Skills", slug: "demos/06-custom-skills" },
            { label: "Copilot CLI", slug: "demos/07-copilot-cli" },
            { label: "Code Quality", slug: "demos/08-code-quality" },
          ],
        },
        {
          label: "Guides",
          items: [
            {
              label: "End-to-End Demo (20 min)",
              slug: "guides/end-to-end-demo",
            },
            { label: "Presenter Tips", slug: "guides/presenter-tips" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Architecture", slug: "reference/architecture" },
            { label: "CI/CD Pipeline", slug: "reference/cicd-pipeline" },
          ],
        },
      ],
    }),
  ],
});
