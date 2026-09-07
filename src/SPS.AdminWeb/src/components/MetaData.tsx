type IMetaData = {
    title?: string;
    noIndex?: boolean;
};

export const MetaData = ({ title, noIndex }: IMetaData) => {
    return (
        <>
            <title>{`${title ? title + " |" : ""} 智慧石化產業資訊暨媒合平台`}</title>

            {noIndex && <meta name="robots" content="noindex" data-rh="true" />}
        </>
    );
};
