import TabbedView from 'tabbedView';
import require from 'require';
import * as globalize from 'globalize';
import 'emby-tabs';
import 'emby-button';
import 'emby-scroller';

export class HomeController {
    constructor(view, params) {
        this.tabbedView = new TabbedView(view, params, this);
    }

    getTabs() {
        return [{
            name: globalize.translate('Home')
        }, {
            name: globalize.translate('Favorites')
        }];
    }

    getDefaultTabIndex() {
        return 0;
    }

    getRequirePromise(deps) {
        return new Promise(function (resolve, reject) {
            require(deps, resolve);
        });
    }

    getTabController(index) {
        if (null == index) {
            throw new Error('index cannot be null');
        }

        let depends = [];

        switch (index) {
            case 0:
                depends.push('controllers/hometab');
                break;

            case 1:
                depends.push('controllers/favorites');
        }

        return this.getRequirePromise(depends).then(function (controllerFactory) {
            let controller = this.tabbedView.tabControllers[index];

            if (!controller) {
                controller = new controllerFactory(this.tabbedView.view.querySelector(".tabContent[data-index='" + index + "']"), this.tabbedView.params);
                this.tabbedView.tabControllers[index] = controller;
            }

            return controller;
        }.bind(this));
    }

    setTitle() {
        Emby.Page.setTitle(null);
    }

    onPause() {
        this.tabbedView.onPause();
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    }

    onResume(options) {
        this.tabbedView.onResume(options);
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    }
}

export default HomeController;
