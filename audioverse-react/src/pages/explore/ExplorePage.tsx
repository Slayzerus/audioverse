import React from "react";
import { useTranslation } from "react-i18next";

const ExplorePage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column"}}>
            <div>{t('explorePage.hello', 'Hello World!')}</div>
        </div>
    );
};

export default ExplorePage;
