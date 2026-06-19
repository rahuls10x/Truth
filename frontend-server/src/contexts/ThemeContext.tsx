import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { type ReactNode } from "react";

type Theme = "light" | "dark";
interface ThemeContextType{
    theme:Theme;
    toggleTheme:()=>void
    changeTheme: (theme:Theme)=>void
}

export function ThemeProvider ({children}: {children: ReactNode}){
    return (
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
        </NextThemesProvider>
    )
}

export function useTheme(): ThemeContextType {
    const { resolvedTheme, setTheme } = useNextTheme();
    const theme: Theme = resolvedTheme === "dark" ? "dark" : "light";
    const changeTheme = (nextTheme: Theme) => setTheme(nextTheme);
    const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

    return { theme, changeTheme, toggleTheme };
}
