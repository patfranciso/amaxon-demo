import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

const customRender = (
  ui: ReactNode,
  options: RenderOptions<
    typeof import('@testing-library/dom/types/queries'),
    HTMLElement,
    HTMLElement
  >,
) => {
  render(ui, { wrapper: AllProviders, ...options });
};
