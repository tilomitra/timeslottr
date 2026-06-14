import { useMDXComponents as themeComponents } from 'nextra-theme-docs'

// Merge Nextra theme MDX components with any project-specific overrides.
export function useMDXComponents(
  components?: Record<string, React.ComponentType<unknown>>
) {
  return {
    ...themeComponents(),
    ...components,
  }
}
