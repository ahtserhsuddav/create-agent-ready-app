// `import Logo from '#/shared/assets/icons/logo.svg?react'` gives a React component (SVGR, set up in next.config.ts).
declare module '*.svg?react' {
  import type { FC, SVGProps } from 'react'

  const Component: FC<SVGProps<SVGSVGElement>>
  export default Component
}
