export function mergeArraysOfObjects(arr1: any[], arr2: any[]) {
    const mergedMap = new Map();

    arr1.forEach(obj => {
        mergedMap.set(obj.id, obj);
    });

    arr2.forEach(obj => {
        mergedMap.set(obj.id, obj);
    });

    return Array.from(mergedMap.values());
}
