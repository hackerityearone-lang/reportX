"use client"

import { createContext, useContext, type ReactNode } from "react"
import { t, type TranslationKey, type TranslationSection } from "./translations"

interface LanguageContextType {
  language: "en"
  t: <K extends TranslationKey, S extends TranslationSection<K>>(section: K, key: S) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const translate = <K extends TranslationKey, S extends TranslationSection<K>>(section: K, key: S): string => {
    return t(section, key, "en")
  }

  return <LanguageContext.Provider value={{ language: "en", t: translate }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
