

export function getFeatureVector() {
    if (typeof FEATURE_VECTOR !== 'undefined') {
        return FEATURE_VECTOR;
    } else {
        // a static host injects nothing, so links go back to wherever this
        // page came from, including its path: on a project site like
        // user.github.io/vodka/ the app is not at the root
        // (comment by Claude)
        return {
            hasstart: false,
            hostname: window.location.host + window.location.pathname
        }
    }
}