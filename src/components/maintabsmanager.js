import dom from 'dom';
import browser from 'browser';
import events from 'events';
import 'emby-tabs';
import 'emby-button';

let tabOwnerView = null;
let queryScope = document.querySelector('.skinHeader');
let footerTabsContainer = null;
let headerTabsContainer = null;
let tabsElem = null;

function enableTabsInFooter() {
    return false;
}

function ensureElements(enableInFooter) {

    if (enableInFooter) {
        if (!footerTabsContainer) {
            footerTabsContainer = document.createElement('div');
            footerTabsContainer.classList.add('footerTabs');
            footerTabsContainer.classList.add('sectionTabs');
            footerTabsContainer.classList.add('hide');
            //appFooter.add(footerTabsContainer);
        }
    }

    if (!headerTabsContainer) {
        headerTabsContainer = queryScope.querySelector('.headerTabs');
    }
}

function onViewTabsReady() {
    this.selectedIndex(this.readySelectedIndex);
    this.readySelectedIndex = null;
}

function allowSwipeOn(elem) {

    if (dom.parentWithTag(elem, 'input')) {
        return false;
    }

    let classList = elem.classList;
    if (classList) {
        return !classList.contains('scrollX') && !classList.contains('animatedScrollX');
    }

    return true;
}

function allowSwipe(target) {
    let parent = target;
    while (parent != null) {
        if (!allowSwipeOn(parent)) {
            return false;
        }
        parent = parent.parentNode;
    }

    return true;
}

function configureSwipeTabs(view, tabsElem, getTabContainersFn) {

    if (!browser.touch) {
        return;
    }

    // implement without hammer
    let onSwipeLeft = function (e, target) {
        if (allowSwipe(target) && view.contains(target)) {
            tabsElem.selectNext();
        }
    };

    let onSwipeRight = function (e, target) {
        if (allowSwipe(target) && view.contains(target)) {
            tabsElem.selectPrevious();
        }
    };

    require(['touchHelper'], function (TouchHelper) {

        let touchHelper = new TouchHelper(view.parentNode.parentNode);

        events.on(touchHelper, 'swipeleft', onSwipeLeft);
        events.on(touchHelper, 'swiperight', onSwipeRight);

        view.addEventListener('viewdestroy', function () {
            touchHelper.destroy();
        });
    });
}

export function setTabs(view, selectedIndex, getTabsFn, getTabContainersFn, onBeforeTabChange, onTabChange, setSelectedIndex) {

    let enableInFooter = enableTabsInFooter();

    if (!view) {
        if (tabOwnerView) {

            if (!headerTabsContainer) {
                headerTabsContainer = queryScope.querySelector('.headerTabs');
            }

            ensureElements(enableInFooter);

            document.body.classList.remove('withSectionTabs');

            headerTabsContainer.innerHTML = '';
            headerTabsContainer.classList.add('hide');

            if (footerTabsContainer) {
                footerTabsContainer.innerHTML = '';
                footerTabsContainer.classList.add('hide');
            }

            tabOwnerView = null;
        }
        return {
            tabsContainer: headerTabsContainer,
            replaced: false
        };
    }

    ensureElements(enableInFooter);

    let tabsContainerElem = enableInFooter ? footerTabsContainer : headerTabsContainer;

    if (!tabOwnerView) {
        tabsContainerElem.classList.remove('hide');
    }

    if (tabOwnerView !== view) {

        let index = 0;

        let indexAttribute = selectedIndex == null ? '' : (' data-index="' + selectedIndex + '"');
        tabsContainerElem.innerHTML = '<div is="emby-tabs"' + indexAttribute + ' class="tabs-viewmenubar"><div class="emby-tabs-slider" style="white-space:nowrap;">' + getTabsFn().map(function(t) {

            let tabClass = 'emby-tab-button';

            if ( t.enabled === false ) {
                tabClass += ' hide';
            }

            let tabHtml;

            if ( t.cssClass ) {
                tabClass += ' ' + t.cssClass;
            }

            if ( t.href ) {
                tabHtml = '<a href="' + t.href + '" is="emby-linkbutton" class="' + tabClass + '" data-index="' + index + '"><div class="emby-button-foreground">' + t.name + '</div></a>';
            } else {
                tabHtml = '<button type="button" is="emby-button" class="' + tabClass + '" data-index="' + index + '"><div class="emby-button-foreground">' + t.name + '</div></button>';
            }

            index++;
            return tabHtml;

        }).join('') + '</div></div>';
        window.CustomElements.upgradeSubtree(tabsContainerElem);

        document.body.classList.add('withSectionTabs');
        tabOwnerView = view;

        tabsElem = tabsContainerElem.querySelector('[is="emby-tabs"]');

        configureSwipeTabs(view, tabsElem, getTabContainersFn);

        tabsElem.addEventListener('beforetabchange', function (e) {

            let tabContainers = getTabContainersFn();
            if (e.detail.previousIndex != null) {

                let previousPanel = tabContainers[e.detail.previousIndex];
                if (previousPanel) {
                    previousPanel.classList.remove('is-active');
                }
            }

            let newPanel = tabContainers[e.detail.selectedTabIndex];

            //if (e.detail.previousIndex != null && e.detail.previousIndex != e.detail.selectedTabIndex) {
            //    if (newPanel.animate && (animateTabs || []).indexOf(e.detail.selectedTabIndex) != -1) {
            //        fadeInRight(newPanel);
            //    }
            //}

            if (newPanel) {
                newPanel.classList.add('is-active');
            }
        });

        if (onBeforeTabChange) {
            tabsElem.addEventListener('beforetabchange', onBeforeTabChange);
        }
        if (onTabChange) {
            tabsElem.addEventListener('tabchange', onTabChange);
        }

        if (setSelectedIndex !== false) {
            if (tabsElem.selectedIndex) {
                tabsElem.selectedIndex(selectedIndex);
            } else {

                tabsElem.readySelectedIndex = selectedIndex;
                tabsElem.addEventListener('ready', onViewTabsReady);
            }
        }

        //if (enableSwipe !== false) {
        //    libraryBrowser.configureSwipeTabs(ownerpage, tabs);
        //}

        return {
            tabsContainer: tabsContainerElem,
            tabs: tabsContainerElem.querySelector('[is="emby-tabs"]'),
            replaced: true
        };
    }

    if (!tabsElem) {
        tabsElem = tabsContainerElem.querySelector('[is="emby-tabs"]');
    }

    tabsElem.selectedIndex(selectedIndex);

    tabOwnerView = view;
    return {
        tabsContainer: tabsContainerElem,
        tabs: tabsElem,
        replaced: false
    };
}

export function selectedTabIndex(index) {

    if (!tabsElem) {
        tabsElem = headerTabsContainer.querySelector('[is="emby-tabs"]');
    }

    if (index != null) {
        tabsElem.selectedIndex(index);
    } else {
        tabsElem.triggerTabChange();
    }
}

export function getTabsElement() {
    return document.querySelector('.tabs-viewmenubar');
}
