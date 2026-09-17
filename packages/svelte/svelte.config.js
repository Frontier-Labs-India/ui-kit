import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// TypeScript inside .svelte files is stripped at package time, so consumers
// receive plain-JS components and compile them with their own Svelte version.
export default {
  preprocess: vitePreprocess(),
}
