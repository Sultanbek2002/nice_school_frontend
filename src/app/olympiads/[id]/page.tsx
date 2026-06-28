"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { GO_API_URL } from "@/utils/apiData";

interface Olympiad {
    ID: number;
    title: string;
    description: string;
    subject: string;
    date: string;
    image_url: string;
    file_url: string;
    format: string;
    location: string;
}

export default function OlympiadDetailPage({ params }: { params: { id: string } }) {
    const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Иконкалар ката бербеши үчүн mounted текшерүү
    useEffect(() => {
        setMounted(true);
    }, []);

    // Олимпиаданын маалыматын ID боюнча бэкендден алуу
    useEffect(() => {
        const fetchOlympiadDetail = async () => {
            try {
                const res = await fetch(`${GO_API_URL}/api/olympiads/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOlympiad(data);
                }
            } catch (err) {
                console.error("Маалыматты жүктөөдө ката кетти:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOlympiadDetail();
    }, [params.id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold animate-pulse">Жүктөлүүдө...</div>;
    }

    if (!olympiad) {
        return <div className="min-h-screen flex items-center justify-center text-2xl font-black text-slate-800">Олимпиада табылган жок</div>;
    }

    const isOnline = olympiad.format === "Онлайн";

    return (
        <main className="min-h-screen pt-32 pb-24 bg-slate-50/50 dark:bg-gray-950">
            <div className="container mx-auto px-4">
                
                {/* 1-БӨЛҮМ: БАННЕР ЖАНА БАШКЫ МААЛЫМАТТАР */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
                    
                    {/* Мукаба Сүрөтү (Сол тарабы) */}
                    <div className="lg:col-span-5 relative aspect-square sm:aspect-video lg:aspect-square w-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-950 bg-white">
                        <Image 
                            src={olympiad.image_url || '/images/courses/placeholder.png'} 
                            alt={olympiad.title} 
                            fill 
                            className="object-cover"
                        />
                        <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl text-white text-xs font-black uppercase tracking-wider border border-white/10">
                            {olympiad.subject}
                        </div>
                    </div>

                    {/* Тексттик Маалыматтар (Оң тарабы) */}
                    <div className="lg:col-span-7 space-y-6 lg:pt-4">
                        <div className="flex flex-wrap gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                isOnline ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-purple-500' : 'bg-blue-500'} animate-pulse`}></span>
                                {olympiad.format} режим
                            </span>
                            <span className="px-4 py-1.5 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-full text-xs font-black uppercase tracking-wider">
                                ID: OL-{olympiad.ID}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                            {olympiad.title}
                        </h1>

                        {/* Кыскача убакыт/орун блоктору */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-slate-100 dark:border-gray-800/60 shadow-xs">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                                    {mounted && <Icon icon="solar:calendar-date-bold-duotone" width={24} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Өткөрүлүүчү күнү</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{olympiad.date}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-slate-100 dark:border-gray-800/60 shadow-xs">
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-500 rounded-xl">
                                    {mounted && <Icon icon="solar:map-point-bold-duotone" width={24} />}
                                </div>
                                <div className="truncate">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Өтүүчү орду</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5 truncate" title={olympiad.location}>
                                        {olympiad.location || "Дареги такталууда"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Катышуу жана Жобону жүктөө баскычтары */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button className="flex-1 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all text-center text-sm active:scale-[0.98]">
                                Олимпиадага катышуу
                            </button>
                            
                            {olympiad.file_url && (
                                <a 
                                    href={olympiad.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    {mounted && <Icon icon="solar:document-download-bold" className="text-emerald-500" width={20} />}
                                    Жобону алуу (.pdf)
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2-БӨЛҮМ: ТОЛУК ТҮШҮНДҮРМӨ ЖАНА ШАРТТАРЫ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-slate-200/60 dark:border-gray-800/60 pt-14">
                    
                    {/* Сол тарабы: Түшүндүрмө жана Сыйлыктар */}
                    <div className="lg:col-span-2 space-y-10">
                        
                        {/* Маалымат */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-gray-800/40 shadow-xs">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                {mounted && <Icon icon="solar:info-circle-bold-duotone" className="text-blue-500" width={24} />}
                                Олимпиада тууралуу
                            </h3>
                            <p className="text-slate-600 dark:text-gray-400 text-base leading-relaxed whitespace-pre-line">
                                {olympiad.description || "Бул олимпиада боюнча толук маалымат жакында жарыяланат."}
                            </p>
                        </div>

                        {/* СЫЙЛЫКТАР БЛОГУ (Каныккан дизайн үчүн кошулду) */}
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-8 rounded-[2.5rem] border border-amber-500/20">
                            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-6 flex items-center gap-2">
                                {mounted && <Icon icon="solar:star-ring-bold-duotone" width={26} />}
                                Жеңүүчүлөргө кандай сыйлыктар бар?
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white/80 dark:bg-gray-900/60 p-5 rounded-2xl border border-amber-500/10 text-center">
                                    <Icon icon="solar:medal-ribbons-star-bold" className="text-amber-500 mx-auto" width={36} />
                                    <h5 className="font-black text-slate-800 dark:text-white mt-2 text-sm">1-Орун</h5>
                                    <p className="text-xs text-gray-500 mt-1">Алтын медаль & Баалуу белек</p>
                                </div>
                                <div className="bg-white/80 dark:bg-gray-900/60 p-5 rounded-2xl border border-amber-500/10 text-center">
                                    <Icon icon="solar:medal-ribbon-bold" className="text-slate-400 mx-auto" width={36} />
                                    <h5 className="font-black text-slate-800 dark:text-white mt-2 text-sm">2-Орун</h5>
                                    <p className="text-xs text-gray-500 mt-1">Күмүш медаль & Диплом</p>
                                </div>
                                <div className="bg-white/80 dark:bg-gray-900/60 p-5 rounded-2xl border border-amber-500/10 text-center">
                                    <Icon icon="solar:medal-ribbon-linear" className="text-amber-700 mx-auto" width={36} />
                                    <h5 className="font-black text-slate-800 dark:text-white mt-2 text-sm">3-Орун</h5>
                                    <p className="text-xs text-gray-500 mt-1">Коло медаль & Сертификат</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Оң тарабы: Катышуу Эрежелери жана Таймер сыяктуу кооз каптал блок */}
                    <div className="space-y-6">
                        
                        {/* Каптал панель: Маанилүү эрежелер */}
                        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-800/40 shadow-xs">
                            <h4 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                {mounted && <Icon icon="solar:shield-check-bold-duotone" className="text-blue-500" width={22} />}
                                Негизги эрежелер
                            </h4>
                            
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-gray-300">Олимпиада башталган убакыттан кечигүүнү мүмкүн эмес.</p>
                                </div>
                                <div className="flex items-start gap-3 bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-gray-300">Катышуучу өзү менен кошо калем жана блокнот ала келиши керек.</p>
                                </div>
                                <div className="flex items-start gap-3 bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-gray-300">Жыйынтыктар 3 жумушчу күндүн ичинде расмий жарыяланат.</p>
                                </div>
                            </div>

                            {/* Сертификат мотивациясы */}
                            <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white text-center shadow-md">
                                <p className="text-[10px] font-black opacity-80 uppercase tracking-wider mb-1">Ар бир катышуучуга</p>
                                <p className="text-xs font-bold leading-snug">Катышкандыгы тууралуу атайын QR-коддуу санариптик Сертификат ыйгарылат.</p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}