import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Country ISO mapping - Intl API prevodi automatski na bilo koji jezik
const countryToISO = {
  'Hrvatska': 'HR', 'Croatia': 'HR',
  'Srbija': 'RS', 'Serbia': 'RS',
  'Slovenija': 'SI', 'Slovenia': 'SI',
  'Bosna i Hercegovina': 'BA', 'Bosnia': 'BA', 'Bosnia and Herzegovina': 'BA',
  'Njemačka': 'DE', 'Germany': 'DE',
  'Austrija': 'AT', 'Austria': 'AT',
  'Italija': 'IT', 'Italy': 'IT',
  'Norveška': 'NO', 'Norway': 'NO',
  'Francuska': 'FR', 'France': 'FR',
  'Španjolska': 'ES', 'Spain': 'ES',
  'Portugal': 'PT',
  'Nizozemska': 'NL', 'Netherlands': 'NL',
  'Belgija': 'BE', 'Belgium': 'BE',
  'Švicarska': 'CH', 'Switzerland': 'CH',
  'Poljska': 'PL', 'Poland': 'PL',
  'Češka': 'CZ', 'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'Slovačka': 'SK', 'Slovakia': 'SK',
  'Mađarska': 'HU', 'Hungary': 'HU',
  'Rumunjska': 'RO', 'Romania': 'RO',
  'Bugarska': 'BG', 'Bulgaria': 'BG',
  'Grčka': 'GR', 'Greece': 'GR',
  'Turska': 'TR', 'Turkey': 'TR',
  'Rusija': 'RU', 'Russia': 'RU',
  'Ukrajna': 'UA', 'Ukraine': 'UA',
  'Danska': 'DK', 'Denmark': 'DK',
  'Švedska': 'SE', 'Sweden': 'SE',
  'Finska': 'FI', 'Finland': 'FI',
  'Irska': 'IE', 'Ireland': 'IE',
  'Velika Britanija': 'GB', 'United Kingdom': 'GB', 'England': 'GB',
  'Albanija': 'AL', 'Albania': 'AL',
  'Sjeverna Makedonija': 'MK', 'North Macedonia': 'MK',
  'Crna Gora': 'ME', 'Montenegro': 'ME',
  'Kosovo': 'XK',
  'Luksemburg': 'LU', 'Luxembourg': 'LU',
  'Malta': 'MT',
  'Cipar': 'CY', 'Cyprus': 'CY',
  'Estonija': 'EE', 'Estonia': 'EE',
  'Latvija': 'LV', 'Latvia': 'LV',
  'Litva': 'LT', 'Lithuania': 'LT',
  'Bjelorusija': 'BY', 'Belarus': 'BY',
  'Moldavija': 'MD', 'Moldova': 'MD',
  'Island': 'IS', 'Iceland': 'IS',
  'Lihtenštajn': 'LI', 'Liechtenstein': 'LI',
  'Monako': 'MC', 'Monaco': 'MC',
  'San Marino': 'SM',
  'Andora': 'AD', 'Andorra': 'AD',
  'Vatikan': 'VA', 'Vatican': 'VA',
};

// Sport mapping HR ↔ EN
const sportHrToEn = {
  'Nogomet': 'Football',
  'Košarka': 'Basketball',
  'Odbojka': 'Volleyball',
  'Tenis': 'Tennis',
  'Rukomet': 'Handball',
  'Plivanje': 'Swimming',
  'Trčanje': 'Running',
  'Biciklizam': 'Cycling',
  'Stolni tenis': 'Table Tennis',
  'Badminton': 'Badminton',
  'Ragbi': 'Rugby',
  'Hokej': 'Hockey',
  'Golf': 'Golf',
  'Padel': 'Padel',
  'Boks': 'Boxing',
  'Atletika': 'Athletics',
  'Pješke': 'Hiking',
  'Fitness': 'Fitness',
  'Crossfit': 'CrossFit',
  'Borilačke vještine': 'Martial Arts',
  'Plesanje': 'Dancing',
  'Skijaški': 'Skiing',
  'Snowboard': 'Snowboarding',
  'Surfanje': 'Surfing',
  'Jedriličarstvo': 'Sailing',
};
const sportEnToHr = Object.fromEntries(Object.entries(sportHrToEn).map(([k, v]) => [v, k]));

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'hr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    return value || key;
  };

  // Prevodi naziv države koristeći Intl API automatski
  const translateCountry = (countryName) => {
    if (!countryName) return countryName;
    try {
      const iso = countryToISO[countryName];
      if (!iso) return countryName;
      const regionNames = new Intl.DisplayNames([language], { type: 'region' });
      return regionNames.of(iso) || countryName;
    } catch {
      return countryName;
    }
  };

  // Prevodi naziv sporta HR ↔ EN
  const translateSport = (sportName) => {
    if (!sportName) return sportName;
    if (language === 'en') return sportHrToEn[sportName] || sportName;
    if (language === 'hr') return sportEnToHr[sportName] || sportName;
    return sportName;
  };

  // Gradovi ne trebaju prijevod (Zagreb = Zagreb svugdje)
  // Ali ako trebaš možeš dodati mapping ovdje

  const switchLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  const availableLanguages = [
    { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  const value = {
    language,
    setLanguage: switchLanguage,
    t,
    translateCountry,
    translateSport,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;