

export function getFeatureVector() {
    if (typeof FEATURE_VECTOR !== 'undefined') {
        return FEATURE_VECTOR;
    } else {
        // a static host injects nothing, so links go back to wherever this
        // page came from
        // (comment by Claude)
        return {
            hasstart: false,
            hostname: window.location.host
        }
    }
}