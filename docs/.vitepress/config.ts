import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'ko-KR',
  title: 'Rendering Lab',
  description: 'WebGPU로 렌더러를 만들며 기록하는 개발 로그',
  base: '/rendering-lab/',

  themeConfig: {
    siteTitle: 'Rendering Lab',

    nav: [
      { text: '홈', link: '/' },
      { text: '개발 로그', link: '/posts/' },
      { text: 'GitHub', link: 'https://github.com/greentea9999/rendering-lab' }
    ],

    sidebar: {
      '/posts/': [
        {
          text: '개발 로그',
          items: [
            { text: '글 목록', link: '/posts/' },
            { text: '첫 글 템플릿', link: '/posts/first-post-template' }
          ]
        }
      ]
    },

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/greentea9999/rendering-lab' }
    ],

    footer: {
      message: 'Built with VitePress',
      copyright: 'Copyright © 2026 Rendering Lab'
    }
  }
})