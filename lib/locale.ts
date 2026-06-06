import { defineTranslations } from "fumadocs-core/i18n";
import { uiTranslations } from "fumadocs-ui/i18n";

export const siteLanguages = {
  en: {
    label: "English",
    htmlLang: "en",
    searchLanguage: "english",
    openInObsidian: "Open in Obsidian",
    translations: defineTranslations().extend(uiTranslations()),
  },
  cn: {
    label: "简体中文",
    htmlLang: "zh-CN",
    searchLanguage: "chinese",
    openInObsidian: "在 Obsidian 中打开",
    translations: defineTranslations()
      .extend(uiTranslations())
      .add("ui", {
        search: "搜索文档",
        searchNoResult: "未找到结果",
        searchOpen: "搜索",
        searchClose: "关闭搜索",
        toc: "目录",
        tocNoHeadings: "无标题",
        tocInline: "本页目录",
        lastUpdate: "最后更新于",
        nextPage: "下一页",
        previousPage: "上一页",
        chooseTheme: "主题",
        editOnGithub: "在 GitHub 上编辑",
        themeToggle: "切换主题",
        themeLight: "浅色",
        themeDark: "深色",
        themeSystem: "跟随系统",
        codeBlockCopy: "复制代码",
        codeBlockCopied: "已复制",
        menuToggle: "菜单",
        pageActionsCopyMarkdown: "复制 Markdown",
        pageActionsOpen: "打开",
        pageActionsOpenGitHub: "在 GitHub 上打开",
        pageActionsViewMarkdown: "查看 Markdown",
        sidebarOpen: "打开侧边栏",
        sidebarCollapse: "收起侧边栏",
        notFoundTitle: "页面未找到",
        notFoundDescription: "请检查地址是否正确",
        notFoundLink: "返回首页",
      }),
  },
} as const;

export type SiteLanguage = keyof typeof siteLanguages;

function resolveSiteLanguage(): SiteLanguage {
  const language = process.env.SITE_LANGUAGE;
  if (language && language in siteLanguages) {
    return language as SiteLanguage;
  }

  return "en";
}

export function getSiteLanguage(): (typeof siteLanguages)[SiteLanguage] {
  return siteLanguages[resolveSiteLanguage()];
}
