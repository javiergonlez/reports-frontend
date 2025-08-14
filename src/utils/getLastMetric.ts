const getLastMetric = (arr: any[]) => { //TODO : TYPES
    return arr.reduce((latest, item) => {
        const parse: (f: string) => Date
            = (f: string) => {
                const [d, m, y] = f.split('/');
                return new Date(+y, +m - 1, +d);
            };
        if (!latest) return item;
        return parse(item.Fecha) > parse(latest.Fecha) ? item : latest;
    }, null);
}

export { getLastMetric };