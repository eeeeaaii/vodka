

export function getFeatureVector() {
    if (typeof FEATURE_VECTOR !== 'undefined') {
        return FEATURE_VECTOR;
    } else {
        return {
            hasstart: false,
            hostname: "localhost:1234"
        }
    }
}