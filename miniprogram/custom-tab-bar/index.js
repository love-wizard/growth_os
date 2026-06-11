/* global Component, getCurrentPages, wx */

const list = [
  {
    pagePath: "/pages/home/index",
    text: "首页",
    icon: "今"
  },
  {
    pagePath: "/pages/weekly-plan/index",
    text: "周计划",
    icon: "周"
  },
  {
    pagePath: "/pages/ai-coach/index",
    text: "饭米粒",
    isCenter: true
  },
  {
    pagePath: "/pages/archive/index",
    text: "成长档案",
    icon: "记"
  },
  {
    pagePath: "/pages/profile/index",
    text: "我的",
    icon: "家"
  }
];

Component({
  data: {
    list,
    selectedRoute: ""
  },
  lifetimes: {
    attached() {
      this.syncSelectedRoute();
    }
  },
  pageLifetimes: {
    show() {
      this.syncSelectedRoute();
    }
  },
  methods: {
    syncSelectedRoute() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (!currentPage || !currentPage.route) {
        return;
      }

      this.setData({ selectedRoute: `/${currentPage.route}` });
    },
    switchTab(event) {
      const path = event.currentTarget.dataset.path;
      if (!path || path === this.data.selectedRoute) {
        return;
      }

      wx.switchTab({ url: path });
    }
  }
});
