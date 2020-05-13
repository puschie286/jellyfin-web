import viewContainer from 'viewContainer';
import focusManager from 'focusManager';
import queryString from 'queryString';
import layoutManager from 'layoutManager';

let currentViewInstance;
let dispatchPageEventsArray;

viewContainer.setOnBeforeChange(function (newView, isRestored, options) {

    let lastView = currentViewInstance;
    if (lastView) {

        let beforeHideResult = dispatchViewEvent( lastView, null, 'viewbeforehide', true );

        if (!beforeHideResult) {
            // todo: cancel
        }
    }

    const eventDetail = getViewEventDetail( newView, options, isRestored );

    if (!newView.initComplete) {
        newView.initComplete = true;

        if (typeof options.controllerFactory === 'function') {

            // Use controller method
            new options.controllerFactory(newView, eventDetail.detail.params);
        } else if (typeof options.controllerFactory === 'object') {

            // Use controller class
            new options.controllerFactory.default(newView, eventDetail.detail.params);
        }

        if (!options.controllerFactory || dispatchPageEventsArray) {
            dispatchViewEvent(newView, eventDetail, 'viewinit');
        }
    }

    dispatchViewEvent(newView, eventDetail, 'viewbeforeshow');
});

function onViewChange(view, options, isRestore) {

    const lastView = currentViewInstance;
    if (lastView) {
        dispatchViewEvent(lastView, null, 'viewhide');
    }

    currentViewInstance = view;

    const eventDetail = getViewEventDetail( view, options, isRestore );

    if (!isRestore) {
        if (options.autoFocus !== false) {
            focusManager.autoFocus(view);
        }
    } else if (!layoutManager.mobile) {
        if (view.activeElement && document.body.contains(view.activeElement) && focusManager.isCurrentlyFocusable(view.activeElement)) {
            focusManager.focus(view.activeElement);
        } else {
            focusManager.autoFocus(view);
        }
    }

    view.dispatchEvent(new CustomEvent('viewshow', eventDetail));

    if (dispatchPageEventsArray) {
        view.dispatchEvent(new CustomEvent('pageshow', eventDetail));
    }
}

function getProperties(view) {
    const props = view.getAttribute( 'data-properties' );

    if (props) {
        return props.split(',');
    }

    return [];
}

function dispatchViewEvent(view, eventInfo, eventName, isCancellable) {

    if (!eventInfo) {
        eventInfo = {
            detail: {
                type: view.getAttribute('data-type'),
                properties: getProperties(view)
            },
            bubbles: true,
            cancelable: isCancellable
        };
    }

    eventInfo.cancelable = isCancellable || false;

    const eventResult = view.dispatchEvent(new CustomEvent(eventName, eventInfo));

    if (dispatchPageEventsArray) {
        eventInfo.cancelable = false;
        view.dispatchEvent(new CustomEvent(eventName.replace('view', 'page'), eventInfo));
    }

    return eventResult;
}

function getViewEventDetail(view, options, isRestore) {

    const url = options.url;
    const index = url.indexOf('?');
    const params = index === -1 ? {} : queryString.parse(url.substring(index + 1));

    return {
        detail: {
            type: view.getAttribute('data-type'),
            properties: getProperties(view),
            params: params,
            isRestored: isRestore,
            state: options.state,

            // The route options
            options: options.options || {}
        },
        bubbles: true,
        cancelable: false
    };
}

function resetCachedViews() {
    // Reset all cached views whenever the skin changes
    viewContainer.reset();
}

document.addEventListener('skinunload', resetCachedViews);

export function loadView(options) {
    let lastView = currentViewInstance;

    // Record the element that has focus
    if (lastView) {
        lastView.activeElement = document.activeElement;
    }

    if (options.cancel) {
        return;
    }

    viewContainer.loadView(options).then(function (view) {
        onViewChange(view, options);
    });
}

export function tryRestoreView(options, onViewChanging) {

    if (options.cancel) {
        return Promise.reject({ cancelled: true });
    }

    // Record the element that has focus
    if (currentViewInstance) {
        currentViewInstance.activeElement = document.activeElement;
    }

    return viewContainer.tryRestoreView(options).then(function (view) {

        onViewChanging();
        onViewChange(view, options, true);

    });
}

export function currentView() {
    return currentViewInstance;
}

export function dispatchPageEvents(value) {
    dispatchPageEventsArray = value;
}
