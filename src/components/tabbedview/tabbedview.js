import backdrop from 'backdrop';
import * as mainTabsManager from 'mainTabsManager';
import layoutManager from 'layoutManager';
import 'emby-tabs';

export default class TabbedView {
    constructor(view, params, controller) {
        this.tabControllers = [];
        this.view = view;
        this.params = params;
        this.controller = controller;

        this.currentTabIndex = parseInt(params.tab || this.controller.getDefaultTabIndex(params.parentId));
        this.initialTabIndex = this.currentTabIndex;

        view.addEventListener('viewbeforehide', this.onPause.bind(this));
        view.addEventListener('viewbeforeshow', this.onViewBeforeShow.bind(this));
        view.addEventListener('viewshow', this.onViewShow.bind(this));
        view.addEventListener('viewdestroy', this.onViewDestroy.bind(this));
    }

    loadTab(index, previousIndex) {
        this.validateTabLoad(index).then(function () {
            this.controller.getTabController(index).then(function (controller) {

                const refresh = !controller.refreshed;

                controller.onResume({
                    autoFocus: previousIndex == null && layoutManager.tv,
                    refresh: refresh
                });

                controller.refreshed = true;

                this.currentTabIndex = index;
                this.currentTabController = controller;
            }.bind(this));
        }.bind(this));
    }

    validateTabLoad(index) {
        return this.controller.validateTabLoad ? this.controller.validateTabLoad(index) : Promise.resolve();
    }

    getTabContainers() {
        return this.view.querySelectorAll('.tabContent');
    }

    onTabChange(e) {
        const newIndex = parseInt(e.detail.selectedTabIndex);
        const previousIndex = e.detail.previousIndex;

        let previousTabController = previousIndex == null ? null : self.tabControllers[previousIndex];
        if (previousTabController && previousTabController.onPause) {
            previousTabController.onPause();
        }

        this.loadTab(newIndex, previousIndex);
    }

    onViewBeforeShow(e) {
        mainTabsManager.setTabs(this.view, this.initialTabIndex, this.controller.getTabs, this.getTabContainers.bind(this), this.onBeforeTabChange.bind(this), this.onTabChange.bind(this), false);
    }

    onViewShow(e) {
        this.onResume(e.detail);
    }

    onViewDestroy(e) {
        let tabControllers = this.tabControllers;

        if (tabControllers) {
            tabControllers.forEach(function (t) {
                if (t.destroy) {
                    t.destroy();
                }
            });

            this.tabControllers = null;
        }

        this.view = null;
        this.params = null;
        this.currentTabController = null;
        this.initialTabIndex = null;
    }

    onBeforeTabChange() {

    }

    onResume(options) {
        this.setTitle();
        backdrop.clear();

        let currentTabController = this.currentTabController;

        if (!currentTabController) {
            mainTabsManager.selectedTabIndex(this.initialTabIndex);
        } else if (currentTabController && currentTabController.onResume) {
            currentTabController.onResume({});
        }
    }

    onPause() {
        let currentTabController = this.currentTabController;

        if (currentTabController && currentTabController.onPause) {
            currentTabController.onPause();
        }
    }

    setTitle() {
        Emby.Page.setTitle('');
    }
}
