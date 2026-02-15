import { Helmet } from 'react-helmet-async';

interface SeoProps {
    title: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'course';
}

export function Seo({
    title,
    description = "منصة تعلّم هي بوابتك لاحتراف البرمجة، تطوير الويب، تطبيقات الموبايل والذكاء الاصطناعي باللغة العربية.",
    keywords = ["تطوير مهارات", "تعلم برمجة", "ذكاء اصطناعي", "دورات مجانية"],
    image = "/opengraph.jpg",
    url = typeof window !== 'undefined' ? window.location.href : '',
    type = 'website'
}: SeoProps) {

    const siteTitle = "منصة تعلّم";
    const fullTitle = `${title} | ${siteTitle}`;

    return (
        <Helmet>
            {/* Basic Strings */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
