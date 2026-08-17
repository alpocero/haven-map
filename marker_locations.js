var markerLocations = {
    "type":"FeatureCollection",
    "features": [
        {
            "type":"Feature",
            "properties":{
                "runame":"Южные Врата Древних",
                "engname": "Southern Gates of the Old Ones",
                "traits": [],
                "description": "",
                "faction": "",
                "province": "Южные пустоши",
                "locationType": "polarGates"
            },
            "geometry":{
                "coordinates": [1860,305],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Северные Врата Древних",
                "engname": "Northern Gates of the Old Ones",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Альбион",
                "locationType": "polarGates"
            },
            "geometry":{
                "coordinates": [1376,3389],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Сломанные Врата Древних",
                "engname": "Broken Gates of the Old Ones",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Талабекланд",
                "locationType": "polarGatesBroken"
            },
            "geometry":{
                "coordinates": [2457,3038],
                "type":"Point"
            }
        },



        // ТЁМНЫЕ ЭЛЬФЫ
        {
            "type":"Feature",
            "properties":{
                "runame":"Железные Льды",
                "engname": "Ironfrost",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Железные Льды",
                "locationType": "fort",
                "image": "images/locations/ironfrost_Irina_Grygorieva.png"
            },
            "geometry":{
                "coordinates": [165,4061],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Лагерь во льдах",
                "engname": "Glacier Encampment",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Железные Льды",
                "locationType": "camp",
                "image": "images/locations/naggaroth.png"
            },
            "geometry":{
                "coordinates": [314,4172],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Смерть Даграка",
                "engname": "Dagrak's End",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Железные Льды",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [515,4204],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Ледяные сады",
                "engname": "The Glacial Gardens",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Холодные пустоши",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [697,4124],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Дворец Разрушения",
                "engname": "The Palace of Ruin",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Холодные пустоши",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [923,4176],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Твердыня Осколков",
                "engname": "Shard Bastion",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Земли осколков",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1259,4155],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Шаграт",
                "engname": "Shagrath",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Земли осколков",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1279,3945],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Крепость Проклятых",
                "engname": "Fortress of the Damned",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Земли осколков",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1508,4029],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Хар-Кальдра",
                "engname": "Har Kaldra",
                "traits": [],
                "description": "Когда-то могущественная крепость тёмных эльфов теперь является израненным, разрушенным кратером, окружённым обломками собственных стен. Малекит, ответив на восстание внутри стен Хар-Кальдры всей колдовской мощью, стал причиной её гибели. <br> Тысячи погибли в ту ночь ужаса и ярости, а еще тысячи были взяты в рабство в Наггаронд, где им предстояло умереть в его огненных ямах и гладиаторских аренах.",
                "faction": "Тёмные эльфы",
                "province": "Железные предгорья",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [324,3910],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Наггаронд",
                "engname": "Naggarond • Город Холода",
                "traits": ["capital_def", "port"],
                "description": "Наггаронд — старейший и крупнейший из городов тёмных эльфов. Его внешние стены образуют внушительный круг из черного камня высотой не менее ста футов. Вокруг крепостных стен возвышаются сто башен, каждая из которых поднимается над зубцами так же высоко, как стены города поднимаются над голой скалой. С этих башен развеваются тёмные знамёна Короля-Колдуна из содранной кожи. Отрубленные головы и измученные вороном конечности гниют на кольях вокруг стен — жуткое напоминание о цене неповиновения воле Малекита.",
                "faction": "Тёмные эльфы",
                "province": "Железные предгорья",
                "locationType": "city",
                "image": "images/locations/naggarond.png"
            },
            "geometry":{
                "coordinates": [450,3758],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Ущелье Ракдо",
                "engname": "Rackdo Gorge",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Железные горы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [226,3754],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Шроктак",
                "engname": "Shroktak Mount",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Железные горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [230,3545],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Алтарь Великой тьмы",
                "engname": "Altar of Ultimate Darkness",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Железное побережье",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [172,3895],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Шпиль эльдар",
                "engname": "Eldar Spire",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Железное побережье",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [57,3770],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Шпиль Дракла",
                "engname": "Drackla Spire",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Железное побережье",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [81,3609],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Хаг Греф",
                "engname": "Hag Graef • Город Теней",
                "traits": ["port"],
                "description": "Хаг Греф — мрачный город культов Кхейна, воздвигнутый на дне ущелья, куда никогда не проникает солнечный свет. Его восемь чёрных башен, соединённых мостами из кости, камня и паучьего шёлка, уходят в небо подобно окаменевшим щупальцам. Богатейший из городов Наггарота, чьи восемь великих семей могущественны настолько, что, объединись они, могли бы свергнуть самого Короля-Колдуна Малекита.",
                "faction": "Тёмные эльфы",
                "province": "Чёрная пойма",
                "locationType": "city",
                "image": "images/locations/hag-graef.png"
            },
            "geometry":{
                "coordinates": [552,3636],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Храм Кхейна",
                "engname": "Temple of Khaine",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Чёрная пойма",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [352,3640],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Крагротская бездна",
                "engname": "Cragroth Deep",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Чёрная пойма",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [410,3537],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Гронд",
                "engname": "Ghrond",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Коварные вершины",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [633,3886],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ашрак",
                "engname": "Ashrak",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Коварные вершины",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [540,3980],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ледяная дорога",
                "engname": "Chill Road",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Коварные вершины",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [527,3849],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Великая Арена",
                "engname": "The Great Arena",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Коварные вершины",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [621,3766],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Кауарк",
                "engname": "Kauark",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Дорога черепов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [810,4027],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Предел Злобы",
                "engname": "Spite Reach",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Дорога черепов",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [759,3901],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Хар Ганет",
                "engname": "Har Ganeth",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Дорога черепов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [849,3819],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Чёрный Столп",
                "engname": "The Black Pillar",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Дорога черепов",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [860,3919],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Даргот",
                "engname": "Dargoth",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Мертволесье",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1003,3962],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Награр",
                "engname": "Nagrar",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Мертволесье",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1090,3869],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Замёрзший город",
                "engname": "The Frozen City",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Мертволесье",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1137,4023],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Шпиль Роткар",
                "engname": "Rothkar Spire",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Красная пустыня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [51,3388],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Шпиль Химерики",
                "engname": "Khymerica Spire",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Красная пустыня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [116,3257],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Паучья равнина",
                "engname": "Plain of Spiders",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Красная пустыня",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [161,3126],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пик Кларак",
                "engname": "Clarak Spire",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Красная пустыня",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [67,3002],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Стораг Кор",
                "engname": "Storag Kor",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Обсидиановые горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [289,3357],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Клар Каронд",
                "engname": "Clar Karond",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Обсидиановые горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [464,3351],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Поляна Отравы",
                "engname": "Venom Glade",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Обсидиановые горы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [568,3271],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Круг Разрушения",
                "engname": "Circle of Destruction",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Обсидиановые горы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [638,3496],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Столп Хотека",
                "engname": "Hotek's Column",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Истерзанный берег",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [690,3320],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Чёрные леса",
                "engname": "The Black Forests",
                "traits": ["forest"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Истерзанный берег",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [829,3348],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Зловещая поляна",
                "engname": "The Twisted Glade",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Истерзанный берег",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [833,3197],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Квинтекс",
                "engname": "Quintex",
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Бересклет",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [269,3049],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Наковальня Ваула",
                "engname": "Vaul's Anvil",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Роковые поляны",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [504,3095],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ведьмин Чертог",
                "engname": "Hag Hall",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Роковые поляны",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [425,2974],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Храм Аддайота",
                "engname": "Temple of Addaioth",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Роковые поляны",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [306,3185],
                "type":"Point"
            }
        },

        
        {
            "type":"Feature",
            "properties":{
                "runame":"Мрачный Оплот",
                "engname": "Bleak Hold Fortress",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Мрачный берег",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [359,2852],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Лес Арнхейма",
                "engname": "Forest of Arnheim",
                "traits": ["forest"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Мрачный берег",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [441,2777],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Осколок Луны",
                "engname": "The Moon Shard",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Мрачный берег",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [537,2622],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Арнхейм",
                "engname": "Arnheim",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Мрачный берег",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [586,2717],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Святилище Кхейна",
                "engname": "Shrine of Khaine",
                "traits": [],
                "description": "Над туманной пустыней Заражённого острова возвышается великое святилище Кхейна, эльфийского Бога Войны. Это место великой силы и глубокого значения как для высших эльфов, так и для тёмных. Обе расы поклоняются Кхейну как богу, и обе претендуют на его святилище.",
                "faction": "Тёмные эльфы",
                "province": "Нагарит",
                "locationType": "shrine",
                "image": "images/locations/shrine-of-khaine.png"
            },
            "geometry":{
                "coordinates": [1035,3063],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Анлек",
                "engname": "Tor Anlec",
                "traits": ["port"],
                "description": "Тор Анлек — некогда столица Нагарита, — был разрушен во время Эльфийской гражданской войны. Неоднократно укреплявшийся и вновь разрушавшийся город сегодня является одним из немногочисленных пристанищ для тёмных эльфов на земле их предков.",
                "faction": "Тёмные эльфы",
                "province": "Нагарит",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [938,2999],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Драниль",
                "engname": "Tor Dranil",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Нагарит",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [797,2894],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Врата Единорога",
                "engname": "Unicorn Gate",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Врата Единорога",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [867,2819],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Анрок",
                "engname": "Tor Anroc",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Тиранок",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [713,2738],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Белый пик",
                "engname": "Whitepeak",
                "traits": ["port"],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Тиранок",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [684,2642],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Аветир",
                "engname": "Avethir",
                "traits": [],
                "description": "",
                "faction": "Тёмные эльфы",
                "province": "Тиранок",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [748,2524],
                "type":"Point"
            }
        },




        // ДИКИЕ ПЛЕМЕНА
        {
            "type":"Feature",
            "properties":{
                "runame":"Серебряная башня чародеев",
                "engname": "The Silvered Tower of Sorcerers",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Северные пустоши",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1512,4325],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Кровавая гора",
                "engname": "Blood Mountain",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Северные пустоши",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [1685,4259],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Инферний",
                "engname": "Infernius",
                "traits": [],
                "description": "Земля вокруг Инферния представляет собой почерневший от сажи ландшафт, испещрённый реками лавы. Действующий вулкан неподалёку питает эти расплавленные реки.",
                "faction": "Дикие племена",
                "province": "Северные пустоши",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [1722,4366],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Дворец Принцев",
                "engname": "Palace of Princes",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Холодные топи",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1617,4124],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Смрадные Катакомбы",
                "engname": "The Foetid Catacombs",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Холодные топи",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1765,4137],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Руины Малофекса",
                "engname": "The Folly of Malofex",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Холодные топи",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1881,4197],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Зловещие башни",
                "engname": "The Twisted Towers",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Холодные топи",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1943,4340],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Звериный утёс",
                "engname": "Cliff of Beasts",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Лагуна вечности",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2110,4306],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Роща Погибели",
                "engname": "The Blighted Grove",
                "traits": ["forest"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Лагуна вечности",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2241,4396],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Чёрная скала",
                "engname": "Black Rock",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Лагуна вечности",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2330,4321],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Желчные утёсы",
                "engname": "Bilious Cliffs",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Зловонная опухоль",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2434,4260],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Лес Разложения",
                "engname": "The Forest of Decay",
                "traits": ["forest"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Зловонная опухоль",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2561,4337],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня мух",
                "engname": "The Tower of Flies",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Зловонная опухоль",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2738,4250],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Сердце вулкана",
                "engname": "Volcano's Heart",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Равнина иллюзий",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2790,4350],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Порт Тайн",
                "engname": "Port of Secrets",
                "traits": ["port"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Равнина иллюзий",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2875,4154],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Кристаллические Шпили",
                "engname": "The Crystal Spires",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Равнина иллюзий",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2991,4274],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Воющая цитадель",
                "engname": "The Howling Citadel",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Водопады Кровавого Пламени",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3153,4225],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Страданий",
                "engname": "The Tower of Torment",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Водопады Кровавого Пламени",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3041,3963],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Монолит Гнилодыха",
                "engname": "Monolith of Festerlung",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Водопады Кровавого Пламени",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [3281,4006],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пылающий монолит",
                "engname": "The Burning Monolith",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Водопады Кровавого Пламени",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [3394,4140],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Извивающаяся крепость",
                "engname": "The Writhing Fortress",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Кровавые болота",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3660,4095],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Монолит Бубоника",
                "engname": "Monolith of Bubonicus",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Кровавые болота",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [3407,3909],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Кровоточащий Шпиль",
                "engname": "The Bleeding Spire",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Кровавые болота",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [3694,3864],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Штормврак",
                "engname": "Stormvrack Mount",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Путь смерти",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3237,3826],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Столб Черепов",
                "engname": "Pillar of Skulls",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Путь смерти",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3505,3702],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Битва племени",
                "engname": "Tribeslaughter",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Путь смерти",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3390,3609],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Дум",
                "engname": "Karak Dum",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Путь смерти",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3551,3527],
                "type":"Point"
            }
        },

        
        {
            "type":"Feature",
            "properties":{
                "runame":"Дерево-виселица",
                "engname": "The Gallows Tree",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "К'дата",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3901,3783],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Равнины Цзаньбайцзинь",
                "engname": "Zanbaijin",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "К'дата",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [4002,3870],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Плавучая гора",
                "engname": "Floating Mountain",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Плато химера",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [4104,3654],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Смерть дракона",
                "engname": "Dragon's Death",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Плато химера",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4142,3495],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Камень испытания",
                "engname": "The Challange Stone",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Плато химера",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [4084,3351],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Гранитные шипы",
                "engname": "Granite Spikes",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Подгорья Каменного Небосвода",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4301,3244],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Волари",
                "engname": "The Volary",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Подгорья Каменного Небосвода",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4447,3309],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Глазная крепость",
                "engname": "Fortress of Eyes",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Подгорья Каменного Небосвода",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [4651,3249],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Железная буря",
                "engname": "Iron Storm",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Восточные степи",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [4790,3275],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Перекрёсток дракона",
                "engname": "Dragon's Crossroad",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Восточные степи",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [4884,3156],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Твердыня Кровавого ветра",
                "engname": "Bloodwind Keep",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Восточные степи",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [4978,3326],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Плавильня костей",
                "engname": "Foundry of Bones",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Красные пустоши",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [5186,3223],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Красная крепость",
                "engname": "Red Fortress",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Красные пустоши",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [5274,3064],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Гнилая скала",
                "engname": "Rotten Stone",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Край гор",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [4655,3382],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Молчащий хребет",
                "engname": "Desolation Ridge",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Край гор",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [4786,3369],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Щербатая гора",
                "engname": "Broken Mount",
                "traits": ["mountain"],
                "description": "",
                "faction": "Дикие племена",
                "province": "Край гор",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [4934,3421],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тёмная башня",
                "engname": "Dark Tower",
                "traits": [],
                "description": "",
                "faction": "Дикие племена",
                "province": "Край гор",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [5090,3345],
                "type":"Point"
            }
        },

        // ВЫСШИЕ ЭЛЬФЫ
        
        {
            "type":"Feature",
            "properties":{
                "runame":"Рухнувшие врата",
                "engname": "Fallen Gates",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Люстерский перешеек",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [176,2355],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Вершины Маку",
                "engname": "Macu Peaks",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Люстерский перешеек",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [209,2111],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Осьминный храм",
                "engname": "Hexoatl",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Люстерский перешеек",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [278,2256],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Порт-Корсар",
                "engname": "Port Reaver",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Берег перешейка",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [396,2225],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Скегги",
                "engname": "Skeggi",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Берег перешейка",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [506,2373],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Рассветный зиккурат",
                "engname": "Ziggurat of Dawn",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Берег перешейка",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [370,2387],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Пауакс",
                "engname": "Pahuax",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Джунгли Пауалаксы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [366,1983],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Монумент Луны",
                "engname": "Monument of The Moon",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Джунгли Пауалаксы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [584,2101],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Болотный городок",
                "engname": "Swamp Town",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Джунгли Пауалаксы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [373,2117],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Святилище Иши",
                "engname": "Shrine of Sotek",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Джунгли Пауалаксы",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [189,1976],
                "type":"Point"
            }
        },
        
        
        {
            "type":"Feature",
            "properties":{
                "runame":"Конкуата",
                "engname": "Konquata",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Альбион",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1382,3435],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Остров Мертвецов",
                "engname": "Isle of Wights",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Альбион",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [1409,3341],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Цитадель Свинца",
                "engname": "Citadel of Lead",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Альбион",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1417,3527],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Чёрного Света",
                "engname": "Blacklight Tower",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Гранитные холмы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [837,3660],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Святилище Ладриэль",
                "engname": "Shrine of Ladrielle",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Гранитные холмы",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [895,3588],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Монолиты",
                "engname": "The Monoliths",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Гранитные холмы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [812,3487],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Каронд Кар",
                "engname": "Karond Kar",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Расколотые земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1109,3680],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пик Чёрного Ручья",
                "engname": "Black Creek Spire",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Расколотые земли",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1076,3550],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мыс Работорговца",
                "engname": "Slaver's Point",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Расколотые земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [957,3482],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Лотерн",
                "engname": "Lothern",
                "traits": ["capital_hef", "port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Эатайн",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1016,2365],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ангерриаль",
                "engname": "Angerrial",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Эатайн",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1078,2442],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Лисеана",
                "engname": "Tower of Lysean",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Эатайн",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [909,2431],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Святилище Асуриана",
                "engname": "Shrine of Asuryan",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Эатайн",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [1033,2497],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Наковальня Ваула",
                "engname": "Vaul's Anvil",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Каледор",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [819,2358],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Сетаи",
                "engname": "Tor Sethai",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Каледор",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [825,2450],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Ашара",
                "engname": "Tor Achare",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Крейс",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1179,2863],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Элизия",
                "engname": "Elisia",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Крейс",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1201,2956],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Святилище Курнуса",
                "engname": "Shrine of Kurnous",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Крейс",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [1062,2967],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Коруали",
                "engname": "Tor Koruali",
                "traits": ["port"],
                "description": "Огромный портовый город, построенный на скалах, который также простирается глубоко под землей.",
                "faction": "Высшие эльфы",
                "province": "Кофик",
                "locationType": "city",
                "image": "images/locations/tor_koruali.png"
            },
            "geometry":{
                "coordinates": [1325,2803],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мистнар",
                "engname": "Mistnar",
                "traits": ["port"],
                "description": "Город высших эльфов на Перемещающихся островах.",
                "faction": "Высшие эльфы",
                "province": "Кофик",
                "locationType": "city",
                "image": "images/locations/mistnar.png"
            },
            "geometry":{
                "coordinates": [1325,2930],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Иврессе",
                "engname": "Tor Yvresse",
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Северный Иврессе",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1267,2653],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тралиния",
                "engname": "Tralinia",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Северный Иврессе",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1372,2599],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Элессаэли",
                "engname": "Elessaeli",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Южный Иврессе",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1264,2454],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Курган Тель",
                "engname": "Cairn Thel",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Южный Иврессе",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1144,2389],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Святилище Лоэка",
                "engname": "Shrine of Loec",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Южный Иврессе",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [1245,2366],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Белая башня Хоэта",
                "engname": "White Tower of Hoeth",
                "traits": ["settlement"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Сафери",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [1178,2598],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Порт Элистор",
                "engname": "Port Elistor",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Сафери",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1138,2502],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Фину",
                "engname": "Tor Finu",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Сафери",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1199,2706],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Элир",
                "engname": "Tor Elyr",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Эллирион",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [823,2575],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Оплот Белого Огня",
                "engname": "Whitefire Tor",
                "traits": ["port"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Эллирион",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [876,2688],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Лютая скала",
                "engname": "Dread Rock",
                "traits": ["port", "colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Драконьи острова",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3891,1841],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Клык Дракона",
                "engname": "Dragon Fang Mount",
                "traits": ["port", "colony", "mountian"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Драконьи острова",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3880,1621],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Залив Расколотого Камня",
                "engname": "Shattered Stone Bay",
                "traits": ["port", "colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Драконьи острова",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4000,1930],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Остров Расколотого Камня",
                "engname": "Shattered Stone Isle",
                "traits": ["port", "colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Драконьи острова",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4002,1776],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Элазор",
                "engname": "Tor Elasor",
                "traits": ["port", "colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Восточные колонии",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3639,365],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Звёзд",
                "engname": "Tower of The Stars",
                "traits": ["port", "colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Восточные колонии",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3743,798],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Солнца",
                "engname": "Tower of The Sun",
                "traits": ["port", "colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Восточные колонии",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3926,615],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Золотой путевой храм",
                "engname": "Temple Avenue of Gold",
                "traits": ["colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Джунгли Богов",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [2874,560],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пещеры Курнуса",
                "engname": "Caverns of Sotek",
                "traits": ["colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Джунгли Богов",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2696,487],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тропа Курнуса",
                "engname": "Sotek's Trail",
                "traits": ["colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Джунгли Богов",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2844,765],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Рассветная крепость",
                "engname": "Fortress of Dawn",
                "traits": ["port", "colony"],
                "description": "Укрепленный форпост высших эльфов. Шпили этого портового города построены вокруг колоссального путевого камня — редкого и ценного пережитка дней, когда солнце никогда не заходило над империей Короля-Феникса.",
                "faction": "Высшие эльфы",
                "province": "Берег Рассвета",
                "locationType": "fort",
                "image": "images/locations/fortress_of_dawn.png"
            },
            "geometry":{
                "coordinates": [2185,320],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Утренний Свет",
                "engname": "Dawn's Light",
                "traits": ["port", "colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Берег Рассвета",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2337,266],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Сурпиндар",
                "engname": "Tor Surpindar",
                "traits": ["colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Берег Рассвета",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2454,357],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Сумеречные вершины",
                "engname": "Dusk Peaks",
                "traits": ["colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Выступы",
                "locationType": "town",
                "image": "images/locations/dusk_peaks_william-trost-richards.png"
            },
            "geometry":{
                "coordinates": [1124,493],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Сумеречная цитадель",
                "engname": "Citadel of Dusk",
                "traits": ["port", "colony"],
                "description": "Поселение высших эльфов, расположенное на самом южном берегу Люстрии. Хотя это изящное сооружение и построено эльфами, оно возведено на месте гораздо более древнего места силы.",
                "faction": "Высшие эльфы",
                "province": "Выступы",
                "locationType": "city",
                "image": "images/locations/citadel_of_dusk.png"
            },
            "geometry":{
                "coordinates": [1211,419],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Священные пруды",
                "engname": "The Sacred Pools",
                "traits": ["colony"],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Священные пруды",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [616,1205],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Врата Грифона",
                "engname": "Griffon Gate",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Врата Грифона",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [787,2743],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Врата Орла",
                "engname": "Eagle Gate",
                "traits": [],
                "description": "",
                "faction": "Высшие эльфы",
                "province": "Врата Орла",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [762,2646],
                "type":"Point"
            }
        },


        //ВЕЧНАЯ КОРОЛЕВА
        {
            "type":"Feature",
            "properties":{
                "runame":"Долина Геан",
                "engname": "Gaean Vale",
                "traits": ["settlement", "sword_of_khaine"],
                "description": "",
                "faction": "Вечная Королева",
                "province": "Авелорн",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1029,2674],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Вечные Глины",
                "engname": "Evershale",
                "traits": ["port"],
                "description": "",
                "faction": "Вечная Королева",
                "province": "Авелорн",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [965,2752],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тор Сароир",
                "engname": "Tor Saroir",
                "traits": [],
                "description": "",
                "faction": "Вечная Королева",
                "province": "Авелорн",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1083,2775],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Врата Феникса",
                "engname": "Phoenix Gate",
                "traits": [],
                "description": "",
                "faction": "Вечная Королева",
                "province": "Врата Феникса",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [982,2851],
                "type":"Point"
            }
        },



        // КАТАЙ
        {
            "type":"Feature",
            "properties":{
                "runame":"Нан-Гау",
                "engname": "Nan-Gau • Город дыма",
                "description": "Нан-Гау, столица северных провинций – главная цитадель западной Великой твердыни, в которой размещаются элитные войска Мяо Ин прямо на пути вторжений, идущих из степей стылого севера.",
                "faction": "Великий Катай",
                "province": "Пороховая тропа",
                "locationType": "city",
                "image": "images/locations/nan-gau.png"
            },
            "geometry":{
                "coordinates": [4555,3031],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Нан-Ли",
                "engname": "Nan-Li",
                "description": "Нан-Ли — город в северных провинциях Великого Катая, расположенный вдоль Пороховой тропы между Шан-Яном и Нан-Гау. Он возвышается над глубинами Пустыни варп-камня, где по земле проносятся зловещие ветры из проклятого региона.",
                "faction": "Великий Катай",
                "province": "Пороховая тропа",
                "locationType": "city",
                "image": "images/locations/nan-li.png"
            },
            "geometry":{
                "coordinates": [4575,2894],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Змеиные врата",
                "engname": "Snake Gate",
                "description": "",
                "faction": "Великий Катай",
                "province": "Западная Великая твердыня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4703,3075],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Драконьи врата",
                "engname": "Dragon Gate",
                "description": "",
                "faction": "Великий Катай",
                "province": "Центральная Великая твердыня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4839,3078],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Черепашьи врата",
                "engname": "Turtle Gate",
                "description": "",
                "faction": "Великий Катай",
                "province": "Восточная Великая твердыня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4986,3071],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Терракотовое кладбище",
                "engname": "Terracotta Graveyard",
                "description": "",
                "faction": "Великий Катай",
                "province": "Страная камней и стали",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4798,2915],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"По-Мей",
                "engname": "Po Mei",
                "description": "",
                "faction": "Великий Катай",
                "province": "Страная камней и стали",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4909,2998],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Вэн-Чан",
                "engname": "Weng Chang",
                "description": "",
                "faction": "Великий Катай",
                "province": "Страная камней и стали",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4687,2813],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Вей-Цзинь",
                "engname": "Wei-Jin • Дворец Императора-Дракона",
                "description": "",
                "faction": "Великий Катай",
                "province": "Имперская тропа",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5101,2994],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мин-Чжу",
                "engname": "Ming Zhu",
                "description": "",
                "faction": "Великий Катай",
                "province": "Имперская тропа",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4964,2833],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Город шугэньганцев",
                "engname": "City of The Shugengan",
                "description": "",
                "faction": "Великий Катай",
                "province": "Имперская тропа",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5181,2840],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Святилище алхимика",
                "engname": "Shrine of The Alchemist",
                "description": "",
                "faction": "Великий Катай",
                "province": "Пустыня варп-камня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4500,2769],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Шан-Ян",
                "engname": "Shang Yang",
                "description": "",
                "faction": "Великий Катай",
                "province": "Пустыня варп-камня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4507,2559],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тай-Цзу",
                "engname": "Tai Tzu",
                "description": "",
                "faction": "Великий Катай",
                "province": "Пустыня варп-камня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4700,2556],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Син-По",
                "engname": "Xing Po",
                "description": "",
                "faction": "Великий Катай",
                "province": "Леса Луны",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4803,2638],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Кунлан",
                "engname": "Kunlan",
                "description": "",
                "faction": "Великий Катай",
                "province": "Леса Луны",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5006,2712],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Селение Луны",
                "engname": "Village of The Moon",
                "description": "",
                "faction": "Великий Катай",
                "province": "Леса Луны",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [5004,2545],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Нефритового ветра",
                "engname": "Jade Wind Mountain",
                "traits": ["mountain"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Леса Луны",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5135,2577],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Чжи-Чжу",
                "engname": "Zhizhu",
                "description": "",
                "faction": "Великий Катай",
                "province": "Равнины Сэнь",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5284,2702],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Хайчай",
                "engname": "Haichai",
                "description": "",
                "faction": "Великий Катай",
                "province": "Равнины Сэнь",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5412,2874],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Сэнь-У",
                "engname": "Xen Wu",
                "description": "",
                "faction": "Великий Катай",
                "province": "Пустоши Цзиньшэня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4493,2425],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Порт Ханью",
                "engname": "Hanyu Port",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Пустоши Цзиньшэня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4501,2287],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Цян",
                "engname": "Qiang",
                "description": "",
                "faction": "Великий Катай",
                "province": "Пустоши Цзиньшэня",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4451,2156],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Шань-Ву",
                "engname": "Shang-Wu",
                "description": "",
                "faction": "Великий Катай",
                "province": "Речные земли Поднебесной Империи",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4656,2212],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ши-Лун",
                "engname": "Shi Long",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Речные земли Поднебесной Империи",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4959,2130],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мост Небес",
                "engname": "Bridge of Heaven",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Речные земли Поднебесной Империи",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4927,2297],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гибельные холмы",
                "engname": "Baleful Hills",
                "description": "",
                "faction": "Великий Катай",
                "province": "Речные земли Поднебесной Империи",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4764,2322],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Нончан",
                "engname": "Nonchang",
                "description": "",
                "faction": "Великий Катай",
                "province": "Низина Нончан",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5081,2271],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Привал Шиямы",
                "engname": "Shiyama's Rest",
                "description": "",
                "faction": "Великий Катай",
                "province": "Низина Нончан",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5076,2125],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Небесный монастырь",
                "engname": "Celestial Monastery",
                "description": "",
                "faction": "Великий Катай",
                "province": "Небесное озеро",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4934,2454],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Чжаньши",
                "engname": "Zhanshi",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Небесное озеро",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5099,2397],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Чимай",
                "engname": "Chimai",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Дельта Нефритовой реки",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5254,2409],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Бэйчай",
                "engname": "Beichai",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Дельта Нефритовой реки",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5427,2564],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Фу-Чоу",
                "engname": "Fu Chow",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Дельта Нефритовой реки",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5419,2331],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Ли-Чжу",
                "engname": "Li Zhu",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Гора Ли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5473,2171],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Храм Ли",
                "engname": "Li Temple",
                "description": "",
                "faction": "Великий Катай",
                "province": "Гора Ли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5358,2076],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ши-Ву",
                "engname": "Shi Wu",
                "description": "",
                "faction": "Великий Катай",
                "province": "Гора Ли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5460,1927],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Дай-Чэн",
                "engname": "Dai Cheng",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Змеиный эстуарий",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5485,1764],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Ашунга",
                "engname": "Tower of Ashung",
                "description": "",
                "faction": "Великий Катай",
                "province": "Змеиный эстуарий",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5320,1687],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Укромная пристань",
                "engname": "Hidden Landing",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Катайские территории",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5496,1509],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Горный перевал",
                "engname": "Mountain Pass",
                "description": "",
                "faction": "Великий Катай",
                "province": "Катайские территории",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5291,1548],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Врата в Куреш",
                "engname": "Gateway to Khuresh",
                "description": "",
                "faction": "Великий Катай",
                "province": "Катайские территории",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5030,1612],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Южный форпост",
                "engname": "",
                "description": "",
                "faction": "Великий Катай",
                "province": "Катайские территории",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5123,1516],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Джунгли Чи'Ан",
                "engname": "Jungles of Chi'an",
                "traits": ["forest"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Джунгли Чи'Ан",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5224,1774],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Бамбуковый перевал",
                "engname": "Bamboo Crossing",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Великий канал",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [5058,2011],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Селение Вай-Ли",
                "engname": "Wai-Li Village",
                "description": "",
                "faction": "Великий Катай",
                "province": "Великий канал",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [5066,1772],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Храм Стихийных Ветров",
                "engname": "Temple of Elemental Winds",
                "description": "",
                "faction": "Великий Катай",
                "province": "Расколотые земли Тянь-Ли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4651,2010],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Селение тигролюдей",
                "engname": "Village of The Tigermen",
                "description": "",
                "faction": "Великий Катай",
                "province": "Расколотые земли Тянь-Ли",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [4760,1913],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Фу-Хун",
                "engname": "Fu Hung",
                "traits": ["port"],
                "description": "",
                "faction": "Великий Катай",
                "province": "Расколотые земли Тянь-Ли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [4924,1744],
                "type":"Point"
            }
        },





        //ЗВЕРОЛЮДИ
        {
            "type":"Feature",
            "properties":{
                "runame":"Водопады Рока",
                "engname": "The Falls of Doom",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Жаркая равнина",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3639,3012],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пагубная долина",
                "engname": "Vale of Woe",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Жаркая равнина",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3776,2777],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Лавовая яма",
                "engname": "Zharr Naggrund",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Жаркая равнина",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3772,2898],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Великие озёра черепов",
                "engname": "Great Skull Lakes",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Зорн-Узкул",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3409,3194],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Воющая скала",
                "engname": "Howling Rock",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Проклятые пустоши",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3475,2735],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Проклятые просторы",
                "engname": "The Blasted Expanse",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Проклятые пустоши",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3436,2926],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Дракенмурские пустоши",
                "engname": "Desolation of Drakenmoor",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Проклятые пустоши",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3330,2821],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Пень Демона",
                "engname": "The Daemon's Stump",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Волчьи земли",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3876,2524],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Волчьи дворы",
                "engname": "The Gates of Zharr",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Волчьи земли",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3666,2607],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Горгота",
                "engname": "Tower of Gorgoth",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Волчьи земли",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3616,2435],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Горбатая гора",
                "engname": "Crookback Mountain",
                "traits": ["mountain"],
                "description": "",
                "faction": "Зверолюди",
                "province": "Пустоши Азгроха",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3372,2399],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Серой Ведьмы",
                "engname": "Mount Grey Hag",
                "traits": ["mountain"],
                "description": "",
                "faction": "Зверолюди",
                "province": "Пустоши Азгроха",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3516,2380],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Серебряное Копьё",
                "engname": "Mount Silverspear",
                "traits": ["mountain"],
                "description": "",
                "faction": "Зверолюди",
                "province": "Пустоши Азгроха",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3325,2497],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Пик Йети",
                "engname": "Yhetee Peak",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Земли Древних Великанов",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [4291,2855],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Зарубка титана",
                "engname": "Titan's Notch",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Земли Древних Великанов",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [4190,2930],
                "type":"Point"
            }
        },
    

        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Сабля",
                "engname": "Sabre Mountain",
                "traits": ["mountain"],
                "description": "",
                "faction": "Зверолюди",
                "province": "Путь на восток",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [3739,3232],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ледоиней",
                "engname": "Icespewer",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Путь на восток",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3873,3294],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пик Метели",
                "engname": "Blizzardpeak",
                "traits": [],
                "description": "",
                "faction": "Зверолюди",
                "province": "Путь на восток",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [4067,3231],
                "type":"Point"
            }
        },




        //МОНСТРЫ
        {
            "type":"Feature",
            "properties":{
                "runame":"Монолит Бьоркила Кроворукого",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Ванахаймские горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1800,3704],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Троллий фьорд",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Ванахаймские горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1548,3680],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Вече грелингов",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Нагльфари",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1918,3840],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Цитадель Рока",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Нагльфари",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2058,3864],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Равнина Нагльфари",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Нагльфари",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2207,3875],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Пристань Змея",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Адского Пика",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1671,3912],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Монолит Катама",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Адского Пика",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1807,3992],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Лагерь варгов",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Адского Пика",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2062,4040],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Бухта Торосов",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Ледяного Зуба",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1815,3509],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Альтарь Багровой жатвы",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Ледяного Зуба",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2016,3620],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Кладбище драккаров",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Ледяного Зуба",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2171,3641],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Залив Клинков",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Тролльхаймские горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2337,3758],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Лагерь сарлов",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Тролльхаймские горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2344,3905],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Хракка",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Тролльхаймские горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2527,3789],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Монолит отродий",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Хель",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2399,4128],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Запретная цитадель",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Хель",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2471,3919],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мясной алтарь",
                "engname": "Altar of Spawns",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Хель",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2613,4025],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Зимний Костёр",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Хель",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2712,4002],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Логово короля троллей",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Великанов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2753,3808],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Крака Драк",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Великанов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2837,3891],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Сьоктракен",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Горы Великанов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2907,3830],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Адская дыра",
                "engname": "Hell Pit",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Перевал Чёрной Крови",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2821,3728],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Эренград",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Река Линск",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2537,3551],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Влаг",
                "engname": "Karak Vlag",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Громадные горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3270,3487],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Форт Дваррслав",
                "engname": "Fort Dwarrslav",
                "traits": [],
                "description": "",
                "faction": "Монстры",
                "province": "Громадные горы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3444,3421],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Храм Хаймкелла",
                "engname": "Temple of Heimkel",
                "traits": ["port"],
                "description": "",
                "faction": "Монстры",
                "province": "Громадные горы",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [3156,3651],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мёрзлый берег",
                "engname": "Frozen Landing",
                "traits": ["port"],
                "description": "",
                "faction": "Монстры",
                "province": "Громадные горы",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3048,3795],
                "type":"Point"
            }
        },


        //ПРААГ
        {
            "type":"Feature",
            "properties":{
                "runame":"Прааг",
                "engname": "Praag",
                "traits": [],
                "description": "Один из древнейших и наиболее укреплённых городов севера Империи, некогда процветавший торговый и культурный центр с роскошными серебряными куполами, оперным театром и академиями магии. Во время Великой Войны армия демонов взяла его штурмом и полностью осквернила — с тех пор стены города покрылись демоническими мутациями, улицы источают безумие, а каждый второй рождённый становился мутантом. Несмотря на вечное проклятие, разруху и бесконечные осады, жители Праага раз за разом отстраивают город и не покидают его — этот несломленный дух и делает Прааг «Бастионом Севера».",
                "faction": "Город-государство Прааг",
                "province": "Проклятый город",
                "locationType": "city",
                "image": "images/locations/praag.png"
            },
            "geometry":{
                "coordinates": [2894,3560],
                "type":"Point"
            }
        },




        //ИМПЕРИЯ
        {
            "type":"Feature",
            "properties":{
                "runame":"Куронн",
                "engname": "Couronne",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Куроннские топи",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1639,3122],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Л'Ангиль",
                "engname": "L'Anguille",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Куроннские топи",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1535,3058],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Лионесс",
                "engname": "Lyonesse",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Берег Лионесса",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1450,2922],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Музильон",
                "engname": "Mousillon",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Берег Лионесса",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1527,2792],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Замок Артуа",
                "engname": "Castle Artois",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Арденский лес",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1641,2949],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гизоро",
                "engname": "Gisoreux",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Арденский лес",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1755,2905],
                "type":"Point"
            }
        },

        {
            "type":"Feature",
            "properties":{
                "runame":"Форт Бергбреш",
                "engname": "Fort Bergbres",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Ущелье Гизоро",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1797,2943],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Бордело",
                "engname": "Bordeleaux",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Река Брианн",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1577,2675],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Аквитания",
                "engname": "Aquitaine",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Река Брианн",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1690,2628],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Замок Бастонь",
                "engname": "Castle Bastonne",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Бастонь",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1715,2781],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Монфор",
                "engname": "Montfort",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Бастонь",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1900,2736],
                "type":"Point"
            }
        },

        {
            "type":"Feature",
            "properties":{
                "runame":"Хельмгарт",
                "engname": "Helmgart",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Перевал Кусачей Секиры",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1949,2797],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Массив Оркал",
                "engname": "Massif Orcal",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Курганы Куилё",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1828,2615],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Замок Каркассон",
                "engname": "Castle Carcassonne",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Каркассон",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1861,2326],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Брионна",
                "engname": "Brionne",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Каркассон",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1683,2432],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Парравон",
                "engname": "Parravon",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Шалонский лес",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1935,2656],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Квенель",
                "engname": "Quenelles",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Шалонский лес",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1925,2502],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Арнау",
                "engname": "Aarnau",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Пустоши",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1846,3348],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Горсель",
                "engname": "Gorssel",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Пустоши",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1846,3144],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мариенбург",
                "engname": "Marienburg",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Пустоши",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1810,3034],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Мыс Мародёра",
                "engname": "Wrecker's Point",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Туманные холмы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1896,3455],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Чёрная Яма",
                "engname": "The Black Pit",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Туманные холмы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2042,3253],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Дитерсхафен",
                "engname": "Dietershafen",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Нордланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2102,3519],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Зальцемюнд",
                "engname": "Salzenmund",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Нордланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2227,3495],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Лаурелорнский лес",
                "engname": "Laurelorn Forest",
                "traits": ["forest"],
                "description": "",
                "faction": "Империя",
                "province": "Лаурелорнский лес",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2124,3357],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Мидденхайм",
                "engname": "Middenheim",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Мидденланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2219,3258],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мидденстаг",
                "engname": "Middenstag",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Мидденланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2281,3184],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Вайсмунд",
                "engname": "Weismund",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Мидденланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2117,3144],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Карробург",
                "engname": "Carroburg",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Мидденланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2037,3033],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Норден",
                "engname": "Norden",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Остланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2376,3559],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Замок фон Раукен",
                "engname": "Castle Von Rauken",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Остланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2584,3471],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Вольфенбург",
                "engname": "Wolfenburg",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Остланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2493,3361],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Горная обитель",
                "engname": "Igerov",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Южная область",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3004,3372],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Форт Торбека",
                "engname": "Fort Jakova",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Южная область",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2962,3247],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Витсбург",
                "engname": "Vitevo",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Южная область",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2837,3287],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Завастра",
                "engname": "Zavastra",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Южная область",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2695,3400],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Медная Крепь",
                "engname": "Brass Keep",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Срединные горы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2379,3403],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Хергиг",
                "engname": "Hergig",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Хохланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2404,3240],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Крюденвальд",
                "engname": "Krudenwald",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Хохланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2297,3308],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Лес грифонов",
                "engname": "Gryphon Wood",
                "traits": ["forest"],
                "description": "",
                "faction": "Империя",
                "province": "Лес грифонов",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2685,3160],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Бекхафен",
                "engname": "Bechafen",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Остермарк",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2713,3307],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мордхайм",
                "engname": "Mordheim",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Остермарк",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2702,3054],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Эссен",
                "engname": "Essen",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Остермарк",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2773,3056],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Нагенхоф",
                "engname": "Nagenhof",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Остермарк",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2875,3152],
                "type":"Point"
            }
        },

        
        {
            "type":"Feature",
            "properties":{
                "runame":"Фленсбург",
                "engname": "Flensburg",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Штирланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2353,2860],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Вюртбад",
                "engname": "Wurtbad",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Штирланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2430,2930],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Нидлинг",
                "engname": "Niedling",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Штирланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2611,2958],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Форт Оберштир",
                "engname": "Fort Oberstyre",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Северная Сильвания",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2670,2867],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Замок Темпельгоф",
                "engname": "Castle Templehof",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Северная Сильвания",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2749,2898],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Вальденгоф",
                "engname": "Waldenhof",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Северная Сильвания",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2883,2995],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Шварцхафен",
                "engname": "Swartzhafen",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Южная Сильвания",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2698,2735],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Эшен",
                "engname": "Eschen",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Южная Сильвания",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2859,2938],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Замок Дракенгоф",
                "engname": "Castle Drakenhof",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Южная Сильвания",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2863,2825],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Вече",
                "engname": "The Moot",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Мутланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2596,2777],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Аверхайм",
                "engname": "Averheim",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Аверланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2461,2765],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гренцштадт",
                "engname": "Grenzstadt",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Аверланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2595,2647],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Пфайльдорф",
                "engname": "Pfeildorf",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Золланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2352,2638],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Штайнгарт",
                "engname": "Steingart",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Золланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2480,2602],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Нульн",
                "engname": "Nuln",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Виссенланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2214,2800],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Доттернбах",
                "engname": "Dotternbach",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Виссенланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2191,2690],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Виссенбург",
                "engname": "Wissenburg",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Виссенланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2310,2704],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Альтдорф",
                "engname": "Altdorf",
                "traits": ["port"],
                "description": "",
                "faction": "Империя",
                "province": "Рейкланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2106,2994],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Айльхарт",
                "engname": "Eilhart",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Рейкланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1928,2955],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ubersreik",
                "engname": "engname",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Рейкланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2024,2839],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Грюнбург",
                "engname": "Grunburg",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Рейкланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2190,2877],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Кемпербад",
                "engname": "Kemperbad",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Талабекланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2264,2945],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Талабхайм",
                "engname": "Talabheim",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Талабекланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2414,3186],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Крюгенхайм",
                "engname": "Krugenheim",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Талабекланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2535,3023],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Каппельбург",
                "engname": "Kappelburg",
                "traits": [],
                "description": "",
                "faction": "Империя",
                "province": "Талабекланд",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2610,3273],
                "type":"Point"
            }
        },


        //ГОРЫ ИРРАНЫ
        {
            "type":"Feature",
            "properties":{
                "runame":"Билбали",
                "engname": "Bilbali",
                "traits": ["port"],
                "description": "",
                "faction": "Маркизат Билбали",
                "province": "Горы Ирраны",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1595,2237],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Монтенас",
                "engname": "Montenas",
                "traits": [],
                "description": "",
                "faction": "Маркизат Билбали",
                "province": "Горы Ирраны",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1655,2099],
                "type":"Point"
            }
        },


        //ЭСТАЛИЯ
        {
            "type":"Feature",
            "properties":{
                "runame":"Магритта",
                "engname": "Magritta",
                "traits": ["port"],
                "description": "",
                "faction": "Графство Эсталия",
                "province": "Эсталия",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1669,1980],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Нуджа",
                "engname": "Nuja",
                "traits": ["port"],
                "description": "",
                "faction": "Графство Эсталия",
                "province": "Эсталия",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1529,1969],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Тобаро",
                "engname": "Tobaro",
                "traits": ["port"],
                "description": "",
                "faction": "Графство Эсталия",
                "province": "Эсталия",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1868,2044],
                "type":"Point"
            }
        },


        //ТИЛЕЯ
        {
            "type":"Feature",
            "properties":{
                "runame":"Миральяно",
                "engname": "Miragliano",
                "traits": ["port"],
                "description": "",
                "faction": "Герцогство Тилея",
                "province": "Тилея",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1988,2098],
                "type":"Point"
            }
        },
                {
            "type":"Feature",
            "properties":{
                "runame":"Риффраффа",
                "engname": "Rifraffa",
                "traits": [],
                "description": "",
                "faction": "Герцогство Тилея",
                "province": "Тилея",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2076,2006],
                "type":"Point"
            }
        },




        //ГНОМЫ
        {
            "type":"Feature",
            "properties":{
                "runame":"Высокое Место",
                "engname": "The High Place",
                "traits": [],
                "description": "",
                "faction": "Клан Уллек",
                "province": "Ущелье Мёртвых Скал",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3179,2543],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Гунбад",
                "engname": "Mount Gunbad",
                "traits": ["mountain"],
                "description": "Главная крепость в Ущелье Мёртвых Скал, единственный источник чрезвычайно ценного бриндюраза («блестящего камня») во всем известном мире. Этот минерал настолько ценен, что когда началась Война Возмездия, и гномы всех крепостей были призваны сражаться с эльфами, жителей Гунбада пощадили, чтобы добыча полезных ископаемых могла продолжаться.",
                "faction": "Клан Уллек",
                "province": "Ущелье Мёртвых Скал",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3239,2718],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Арка Края Света",
                "engname": "World's Edge Archway",
                "traits": [],
                "description": "",
                "faction": "Клан Уллек",
                "province": "Ущелье Мёртвых Скал",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3275,2602],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Собачья равнина",
                "engname": "Plain of Dogs",
                "description": "",
                "faction": "Новаторы",
                "province": "Пустыня Железные Пески",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [157,2923],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Ущелье Ледяных Скал",
                "engname": "Ice Rock Gorge",
                "description": "",
                "faction": "Новаторы",
                "province": "Пустыня Железные Пески",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [297,2982],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Пик Тирана",
                "engname": "Tyrant Peak",
                "traits": ["mountain"],
                "description": "",
                "faction": "Новаторы",
                "province": "Ясеневый берег",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [94,2652],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Железный Шип",
                "engname": "Ironspike",
                "description": "",
                "faction": "Новаторы",
                "province": "Ясеневый берег",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [176,2522],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Логово Скарпела",
                "engname": "Scarpel's Lair",
                "description": "",
                "faction": "Новаторы",
                "province": "Ясеневый берег",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [61,2770],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Серники",
                "engname": "Sulpharets",
                "description": "",
                "faction": "Новаторы",
                "province": "Ясеневый берег",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [87,2458],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Древний город Квинтекс",
                "engname": "Ancient City of Quintex",
                "description": "",
                "faction": "Новаторы",
                "province": "Вершины Титана",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [295,2735],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Окаменевший лес",
                "engname": "Petrified Forest",
                "traits": ["forest"],
                "description": "",
                "faction": "Новаторы",
                "province": "Вершины Титана",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [306,2568],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мыс Серой Скалы",
                "engname": "Grey Rock Point",
                "traits": ["port"],
                "description": "",
                "faction": "Новаторы",
                "province": "Вершины Титана",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [426,2507],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Сс'ильдра Тор",
                "engname": "S'sildra Tor",
                "description": "",
                "faction": "Новаторы",
                "province": "Вершины Титана",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [256,2472],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Зорн",
                "engname": "Karak Zorn",
                "description": "Легендарная крепость гномов, построенная тысячи лет назад, контакт с которой был давно утрачен. Вопрос о том, существует ли до сих пор эта цитадель — да и существовала ли вообще, — так и остаётся открытым, однако подробности о сказочных сокровищах и невероятных богатствах её королей часто обсуждаются за кружкой доброго гномьего эля.",
                "faction": "Экспедиция Железноброва",
                "province": "Южная окраина Краесветных гор",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2727,1018],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Затерянное плато",
                "engname": "Lost Plateau",
                "description": "",
                "faction": "Экспедиция Железноброва",
                "province": "Южная окраина Краесветных гор",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2816,1122],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Арахнос",
                "engname": "Mount Arachnos",
                "traits": ["mountain"],
                "description": "",
                "faction": "Экспедиция Железноброва",
                "province": "Южная окраина Краесветных гор",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2850,1232],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Тхагг",
                "engname": "Karak Thagg",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Болота Погибели",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [1858,2125],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Изор",
                "engname": "Karak Izor",
                "description": "Первая и самая большая твердыня гномов, находящаяся за пределами Краесветных гор. Возраст и престиж этих владений таковы, что все прочие поселения гномов в Подземелье, Ирранских и Апуччинских горах обращаются к Карак-Изору за покровительством и защитой.",
                "faction": "Клан Ангрунд",
                "province": "Подземелья",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2240,2322],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Буфдар",
                "engname": "Karak Bhufdar",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Подземелья",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2129,2286],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Заракзил",
                "engname": "Zarakzil",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Подземелья",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2159,2083],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Грюнг Цинт",
                "engname": "Grung Zint",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Северные Серые горы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [1738,3006],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Застава Чёрного Камня",
                "engname": "Blackstone Post",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Северные Серые горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1827,2880],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Зифлин",
                "engname": "Karak Ziflin",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Северные Серые горы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [1909,2809],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Азгараз",
                "engname": "Karak Azgaraz",
                "description": "Одна из главных крепостей гномов, расположенная недалеко от имперского торгового города Юбершрайк. Гномов этого региона их восточные сородичи называют «серыми гномами», что указывает не только на их местоположение, но и на суровый взгляд на жизнь и относительную аскетичность их крепостей.",
                "faction": "Клан Ангрунд",
                "province": "Южные Серые горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2024,2739],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Норн",
                "engname": "Karak Norn",
                "description": "Карак-Норн является самым большим из поселений Серых гор. Его населяют лишившиеся своего дома кланы из павшей крепости Серебряный Пик и дозорных башен перевала Бешеного Пса. Карак-Норн находится на единственных крупных залежах металлов и полудрагоценных камней в Серых горах.",
                "faction": "Клан Ангрунд",
                "province": "Южные Серые горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2137,2635],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гримхолд",
                "engname": "Grimhold",
                "description": "Приходящее в упадок поселение серых гномов.",
                "faction": "Клан Ангрунд",
                "province": "Южные Серые горы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2186,2450],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Долина Хрящей",
                "engname": "Gristle Valley",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Южные Серые горы",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2247,2530],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Форт Золл",
                "engname": "Fort Soll",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Перевал Пасти Зимы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2332,2508],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Хирн",
                "engname": "Karak Hirn",
                "description": "Крупнейшая и важнейшая крепость гномов в Чёрных горах, расположенная между Восточными Пограничными княжествами и южными границами Империи. В настоящее время крепостью правит король Алрик Ранульфссон из клана Дражкарак и его жена, королева Виннифер Фальксенхейр.",
                "faction": "Клан Ангрунд",
                "province": "Чёрные горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2363,2481],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мигдал Вонгалбарак",
                "engname": "Mighdal Vongalbarak",
                "description": "",
                "faction": "Клан Ангрунд",
                "province": "Чёрные горы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2599,2561],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Хазид Иркулаз",
                "engname": "Khazid Irkulaz",
                "description": "Горнодобывающее поселение, принадлежащее Карак Разъяку.",
                "faction": "Земли мстителей",
                "province": "Северные Краесветные горы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3197,3121],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Унгор",
                "engname": "Karak Ungor",
                "description": "Карак Унгор представляет собой огромную сеть глубоких пещер под горами, шахты которых являются самыми глубокими во всех старых владениях гномов.",
                "faction": "Земли мстителей",
                "province": "Северные Краесветные горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3087,3206],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Разъяк",
                "engname": "Karak Raziak",
                "description": "Небольшая гномья крепость.",
                "faction": "Земли мстителей",
                "province": "Северные Краесветные горы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3039,3088],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Кадрин",
                "engname": "Karak Kadrin",
                "description": "Карак Кадрин является вырезанной в холодных и зазубренных пиках внушительной цитаделью. Воинственные кланы, населяющие Карак-Кадрин, гордятся тем, что охраняют этот проход, отгоняя нарушителей и позволяя ему оставаться свободным.",
                "faction": "Земли мстителей",
                "province": "Перевал Вершин",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2987,2981],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Логово Гнашрака",
                "engname": "Gnashrak's Lair",
                "description": "",
                "faction": "Земли мстителей",
                "province": "Перевал Вершин",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3169,2969],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Караг Дромар",
                "engname": "Karag Dromar",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Черноводье",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2701,2593],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Дубомолот",
                "engname": "Oakenhammer",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Черноводье",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2862,2724],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Жуфбар",
                "engname": "Zhufbar",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Черноводье",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2951,2749],
                "type":"Point"
            }
        },

        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Гром",
                "engname": "Grom Peak",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Рёберные вершины",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3075,2720],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Павшего Короля",
                "engname": "Fallen King Mountain",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Рёберные вершины",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3155,2898],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Караз-а-Карак",
                "engname": "Karaz-a-Karak",
                "description": "Караз-а-Карак является цитаделью верховного короля Торгрима Злопамятного. Это самая большая, самая древняя и самая укреплённая твердыня гномов из всех. Караз-а-Карак — это подлинный центр культуры и древних традиций гномов: многие благородные кланы Караз-а-Карака могут похвастаться своей родословной, восходящей к самим богам-предкам. Внутри величественных стен и сводов твердыни расположены огромные храмы богов-предков; здесь также хранятся Великая Книга Обид, Книга Воспоминаний и великое множество бесценных сокровищ, каждое из которых является объектом благоговения и почитания для любого гнома.",
                "faction": "Верховный король Торгрим Злопамятный из клана Уллек",
                "province": "Серебряная тропа",
                "locationType": "city",
                "image": "images/locations/karaz-a-karak.png"
            },
            "geometry":{
                "coordinates": [2948,2535],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Столпы Грунгни",
                "engname": "The Pillars of Grungni",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Серебряная тропа",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [3047,2523],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Сквингорог",
                "engname": "Mount Squighorn",
                "traits": ["mountain"],
                "description": "",
                "faction": "Клан Уллек",
                "province": "Серебряная тропа",
                "locationType": "pointOfInterest",
                'image': "images/locations/mount_squighorn.png"
            },
            "geometry":{
                "coordinates": [3118,2472],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Караг Дрон",
                "engname": "Karag Dron • Громовая гора",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Перевал Смерти",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3008,2387],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Железная Скала",
                "engname": "Iron Rock",
                "description": "Масштабные шахтные выработки богатых залежей полезных ископаемых.",
                "faction": "Клан Уллек",
                "province": "Перевал Смерти",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2915,2264],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Чёрный Утёс",
                "engname": "Black Crag • Карак Драж",
                "description": "Третья по величине гномья твердыня, уступающая лишь Караз-а-Караку и Караку-Восьми-Вершин. Располагаясь на западном конце перевала Смерти, земли которого богаты месторождениями полезных ископаемых и металлов, рудники Карак Дража простираются как вдоль всего перевала, так и в окружающих горах.",
                "faction": "Клан Уллек",
                "province": "Перевал Смерти",
                "locationType": "city",
                "image": "images/locations/black_crag.png"
            },
            "geometry":{
                "coordinates": [3013,2231],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак-Восемь-Вершин",
                "engname": "Karak Eight Peaks",
                "description": "Карак-Восемь-Вершин — самая значительная из южных крепостей с бесчисленными шахтами, тоннелями, святилищами и храмами. Город построен в громадном природном амфитеатре в окружении восьми высоких вершин: Караг Зильфин, Караг Яр, Караг Монар, Кагрил (называемый также «Серебряный Рог»), Караг Лун, Караг Рин, Караг Нар и Квинн-Вир (на людском «Белая Госпожа»).",
                "faction": "Гномы",
                "province": "Восемь Вершин",
                "locationType": "city",
                "image": "images/locations/karak_ep.png"
            },
            "geometry":{
                "coordinates": [3045,2120],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Скорбь Валайи",
                "engname": "Valaya's Sorrow",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Восемь Вершин",
                "locationType": "town",
                "image": "images/locations/valayas_sorrow.png"
            },
            "geometry":{
                "coordinates": [2949,2065],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Форт Кривой Клык",
                "engname": "Crooked Fang Fort",
                "traits": [],
                "description": "",
                "faction": "Клан Уллек",
                "province": "Восточные бедные земли",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2927,1920],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Дрингоракказ",
                "engname": "Dringorackaz",
                "traits": [],
                "description": "",
                "faction": "Клан Уллек",
                "province": "Восточные бедные земли",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3025,1922],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пик Злобы",
                "engname": "Spitepeak",
                "traits": [],
                "description": "",
                "faction": "Клан Уллек",
                "province": "Восточные бедные земли",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3157,1926],
                "type":"Point"
            }
        },
        


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Азгал",
                "engname": "Karak Azgal • Драконий утёс",
                "description": "В прошлом чрезвычайно богатая цитадель гномов, ныне пришедшая в упадок.",
                "faction": "Клан Уллек",
                "province": "Скверноводье",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2858,1828],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Крадтоммен",
                "engname": "Kradtommen",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Скверноводье",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2991,1809],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Туманная гора",
                "engname": "Misty Mountain",
                "traits": ["mountain"],
                "description": "Большая гора, расположенная к западу от Кислого Моря в Краесветных горах, обращённая к Проклятой яме Нагашиззар.",
                "faction": "Клан Уллек",
                "province": "Скверноводье",
                "locationType": "pointOfInterest",
                "image": "images/locations/misty_mountain.png"
            },
            "geometry":{
                "coordinates": [3129,1780],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Азул",
                "engname": "Karak Azul",
                "description": "Последняя уцелевшая твердыня из великих южных владений, оставшихся под контролем гномов в Краесветных горах.",
                "faction": "Клан Уллек",
                "province": "Южные Краесветные горы",
                "locationType": "city",
                "image": "images/locations/karak_azul.png"
            },
            "geometry":{
                "coordinates": [3198,2088],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Чёрный Рудник",
                "engname": "Black Iron Mine",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Южные Краесветные горы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3187,2225],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Сточный колодец",
                "engname": "Sump Pit",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Южные Краесветные горы",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3225,2004],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Костяное ущелье",
                "engname": "The Bone Gulch",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Равнина костей",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3367,1951],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пепельный Хребет",
                "engname": "Ash Ridge Mountains",
                "traits": ["mountain"],
                "description": "",
                "faction": "Клан Уллек",
                "province": "Равнина костей",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3450,2118],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Крепость Ворага",
                "engname": "The Fortress of Vorag",
                "description": "",
                "faction": "Клан Уллек",
                "province": "Равнина костей",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [3555,2021],
                "type":"Point"
            }
        },




        //РАЗБОЙНИЧЬИ ЗЕМЛИ
        {
            "type":"Feature",
            "properties":{
                "runame":"Люччини",
                "engname": "Luccini",
                "traits": ["port"],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Пиратское течение",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2022,1900],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Сартоза",
                "engname": "Sartosa",
                "traits": ["port"],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Пиратское течение",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1971,1805],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Мирмиденс",
                "engname": "Myrmidens",
                "traits": ["port"],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Западные Пограничные княжества",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2291,2008],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Верданос",
                "engname": "Verdanos",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Западные Пограничные княжества",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2225,2082],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Аргалис",
                "engname": "Argalis",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Западные Пограничные княжества",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2154,1928],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Зворак",
                "engname": "Zvorak",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Западные Пограничные княжества",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2320,2263],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Акендорф",
                "engname": "Akendorf",
                "traits": [],
                "description": "Город-крепость Акендорф был построен императором Ульрихом Первым как символ величия Рейкланда и его власти, простирающейся даже в Разбойничьи земли. Однако после его смерти этот некогда богатейший город окружающих земель стал пристанищем для бесконечных банд, превратившись в обитель контрабандистов. Чёрный рынок Акендорфа — место, где можно купить практически всё, если есть связи и золото.",
                "faction": "Разбойничьи земли",
                "province": "Восточные Пограничные княжества",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2710,2495],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Карак Ангажар",
                "engname": "Karak Angazhar",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Восточные Пограничные княжества",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2525,2450],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Маторка",
                "engname": "Matorca",
                "traits": ["port"],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Восточные Пограничные княжества",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2531,2335],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Барак Варр",
                "engname": "Barak Varr",
                "traits": ["port"],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Долина Кровавой реки",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2690,2363],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Док Караз",
                "engname": "Dok Karaz",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Долина Кровавой реки",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2675,2292],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Бараг Давазбаг",
                "engname": "Barag Dawazbag",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Долина Кровавой реки",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2836,2348],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Варенкийские холмы",
                "engname": "Varenka Hills",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Долина Кровавой реки",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2808,2443],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Сумрачный лес",
                "engname": "Forest of Gloom",
                "traits": ["forest"],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Сумрачный лес",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2812,2534],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Экрунд",
                "engname": "Ekrund",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Западные бедные земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2529,2052],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Рудник Горького Камня",
                "engname": "Bitterstone Mine",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Западные бедные земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2638,2082],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Башня Каменной Шахты",
                "engname": "Stonemine Tower",
                "traits": ["port"],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Западные бедные земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2503,2225],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Рудники Драконьего Рога",
                "engname": "Dragonhorn Mines",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Западные бедные земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2588,1955],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Галбараз",
                "engname": "Galbaraz",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Южные бедные земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2495,1742],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гронти Мингол",
                "engname": "Gronti Mingol",
                "traits": ["port"],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Южные бедные земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2340,1908],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Штормхендж",
                "engname": "Stormhenge",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Южные бедные земли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2273,1636],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Моргхайм",
                "engname": "Morgheim",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Топи безумия",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2741,1891],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Затонувший Кернарх",
                "engname": "Sunken Khernarch",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Топи безумия",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2590,1681],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Плавучая Деревня",
                "engname": "Floating Village",
                "traits": [],
                "description": "",
                "faction": "Разбойничьи земли",
                "province": "Топи безумия",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2732,1751],
                "type":"Point"
            }
        },




        // ЦАРИ ГРОБНИЦ
        {
            "type":"Feature",
            "properties":{
                "runame":"Дохлое ущелье",
                "engname": "Deff Gorge",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Пограничные идолы",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2870,1632],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гор Газан",
                "engname": "Gor Gazan",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Пограничные идолы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2357,1540],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Аргул Мигдал",
                "engname": "Agrul Migdhal",
                "traits": [],
                "description": "Крепость, возведённая Древними, стены которой сделаны из того же материала, что и идолы, расположенные вдоль границ этих земель.",
                "faction": "Цари гробниц",
                "province": "Пограничные идолы",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2611,1531],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Зюденбург",
                "engname": "Sudenburg",
                "traits": ["port"],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Страна Дервишей",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2204,1178],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Равнина Клыкачей",
                "engname": "Plain of Tuskers",
                "traits": ["port"],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Страна Дервишей",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [2239,1059],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Ка-Сабар",
                "engname": "Ka-Sabar",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Зыбучие Пески",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2566,1138],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Антох",
                "engname": "Antoch",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Зыбучие Пески",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2417,1008],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Бхагар",
                "engname": "Bhagar",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Зыбучие Пески",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2393,1138],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Чёрная пирамида Нагаша",
                "engname": "Black Pyramid of Nagash",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Дельта Великой Мортис",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2315,1307],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Хемри",
                "engname": "Khemri • Город Царей",
                "traits": [],
                "description": "Жемчужина в короне Нехекары. Это самый старый, большой, гордый и могущественный из всех древних городов. Монументы, возведённые в этом величественном некрополе, огромны и грандиозны на вид. Высеченные изображения богов и чудовищ смотрят со всех крыш, и статуи стоят на каждом углу запылённых улиц. На протяжении длинной истории Нехехары самые великие из всех царей происходили из Хемри.",
                "faction": "Цари гробниц",
                "province": "Страна Мёртвых",
                "locationType": "city",
                "image": "images/locations/khemri.png"
            },
            "geometry":{
                "coordinates": [2448,1332],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Источники Великой Жизни",
                "engname": "Springs of Eternal Life",
                "traits": [],
                "description": "Источники Вечной Жизни когда-то были священным местом для жителей Нехекары, пока их не осквернили руки Великого Некроманта Нагаша.",
                "faction": "Цари гробниц",
                "province": "Страна Мёртвых",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2510,1238],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Нумас",
                "engname": "Numas",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Страна Мёртвых",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2606,1371],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Катар",
                "engname": "Quatar",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Страна Мёртвых",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2715,1276],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Лахмия",
                "engname": "Lahmia • Город Проклятых",
                "traits": [],
                "description": "Лахмия, некогда известная как город Рассвета, была одним из древних городов-государств, которые вместе составляли великую человеческую империю Нехехара, ныне называемую Страной Мёртвых.",
                "faction": "Цари гробниц",
                "province": "Кратер Ходячих Мертвецов",
                "locationType": "city",
                "image": "images/locations/lahmia.png"
            },
            "geometry":{
                "coordinates": [3194,1602],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Либарас",
                "engname": "Lybaras • Город-гробница Асаф",
                "traits": ["port"],
                "description": "Когда-то Либарас был городом учёных и инженеров. Его жрецы-цари и знать были известны своим относительно скромным стилем одежды, предпочитая тратить свои богатства на свитки и технологии.",
                "faction": "Цари гробниц",
                "province": "Кратер Ходячих Мертвецов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3303,1471],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Расетра",
                "engname": "Rasetra • Крепость Мстительных Душ",
                "traits": [],
                "description": "Расетра — один из древних городов-государств затерянной человеческой империи Нехекара, ныне Страны Мёртвых.",
                "faction": "Цари гробниц",
                "province": "Кратер Ходячих Мертвецов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3062,1330],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Роковая поляна",
                "engname": "Doom Glade",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Кратер Ходячих Мертвецов",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3234,1307],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Караг Орруд",
                "engname": "Karag Orrud • Гора Красного Облака",
                "traits": ["mountain"],
                "description": "Самый южный действующих вулкан из трёх великих вулканов Краесветных гор — наряду с Громовой и Огненной горой. Землетрясения и подземные толчки мешали гномам создавать горные крепости в этом регионе, однако некоторые предприимчивые гномы-шахтёры иногда прибывают сюда в поисках сокровищ земли.",
                "faction": "Цари гробниц",
                "province": "Хребет Дьявола",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2880,1422],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Гранитный массив",
                "engname": "Granite Massif",
                "traits": [],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Хребет Дьявола",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [3018,1413],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Маграк",
                "engname": "Mahrak • Город Разложения",
                "traits": [],
                "description": "Махрак, некогда называемый Городом Надежды и считавшийся в древности колыбелью религии Нехекары, — один из древних городов-государств Страны Мёртвых, падшей человеческой империи Нехекара.",
                "faction": "Цари гробниц",
                "province": "Хребет Дьявола",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3090,1476],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Гора Грифов",
                "engname": "Vulture Mountain",
                "traits": ["mountain"],
                "description": "",
                "faction": "Цари гробниц",
                "province": "Аталанские горы",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [1818,1337],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Мартек",
                "engname": "Martek",
                "traits": [],
                "description": "Мартек — один из четырёх великих городов Аравии. Окружающие его земли образуют наиболее свободное княжество, управляемое монархом с титулом халифа.",
                "faction": "Цари гробниц",
                "province": "Аталанские горы",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1956,1462],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Глаз Пантеры",
                "engname": "Eye of The Panther",
                "traits": [],
                "description": "Регион Аталанских гор, давший название имперскому ордену Рыцарей Пантеры.",
                "faction": "Цари гробниц",
                "province": "Аталанские горы",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [1925,1419],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Дворец халифа-мага",
                "engname": "Wizard Caliph's Palace",
                "traits": [],
                "description": "Ходят слухи, что халиф-маг является одним из самых искусных мастеров по снятию и наложению проклятий, но цена за его услуги высока.",
                "faction": "Цари гробниц",
                "province": "Страна Ассасинов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1748,1237],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Лашайк",
                "engname": "Lashiek",
                "traits": ["port"],
                "description": "Построенный как символ богатства и изысканности Аравии, Лашайк поражает своими прекрасными мраморными зданиями, балюстрадами и обширными садами. Это центр всей работорговли в регионе, где обучают новоприбывших или захваченных рабов, прежде чем продать их дальше по побережью.",
                "faction": "Цари гробниц",
                "province": "Страна Ассасинов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1796,1456],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Острова Чародеев",
                "engname": "Sorcerers' Islands",
                "traits": ["port"],
                "description": "Место магии, где практикуют и экспериментируют с колдовскими искусствами, которые исторически позволяли жителям Аравии добиваться больших успехов на мировой арене.",
                "faction": "Цари гробниц",
                "province": "Страна Ассасинов",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1682,1424],
                "type":"Point"
            }
        },
        

        {
            "type":"Feature",
            "properties":{
                "runame":"Аль-Хаикк",
                "engname": "Al Haikk",
                "traits": ["port"],
                "description": "Крупнейший мегаполис с рынками, садами, дворцами и разбойными промыслами, откуда халиф правит халифатом.",
                "faction": "Цари гробниц",
                "province": "Берег Аравии",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2045,1537],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Кофер",
                "engname": "Copher",
                "traits": ["port"],
                "description": "Кофер, возможно, ещё богаче Аль-Хаикка, поскольку ведет торговлю с высшими эльфами и даже с некоторыми отдалёнными регионами.",
                "faction": "Цари гробниц",
                "province": "Берег Аравии",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [1894,1578],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Фирус",
                "engname": "Fyrus",
                "traits": [],
                "description": "Древний город, заселённый ещё со времен, когда побережье Аравии было колонией высших эльфов.",
                "faction": "Цари гробниц",
                "province": "Берег Аравии",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [1981,1615],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Чёрная башня Архана",
                "engname": "Black Tower of Arkhan",
                "traits": [],
                "description": "Чёрная башня Архана была построена доверенным визирем Нагаша. Изолированное глубоко в Треснувшей земле, это место служило убежищем, где Архан мог развивать своё мастерство тёмной магии. Сама башня и окружающие её земли пропитаны загадочной магией, а в тенях постройки обитает множество мерзких существ.",
                "faction": "Цари гробниц",
                "province": "Треснувшая земля",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2201,1360],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Зандри",
                "engname": "Zandri",
                "traits": ["port"],
                "description": "Берег Зандри усеян обломками кораблей тех, кто нападал на порт, чтобы разграбить его богатства. Флоты до сих пор отплывают из города, чтобы завоевать земли живых.",
                "faction": "Цари гробниц",
                "province": "Треснувшая земля",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2162,1502],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Эль-Калабад",
                "engname": "El Kalabad",
                "traits": [],
                "description": "Аравийский торговый город.",
                "faction": "Цари гробниц",
                "province": "Треснувшая земля",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2124,1261],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Пруды Отчаяния",
                "engname": "Pools of Despair",
                "traits": [],
                "description": "Неизвестно, какая мерзкая магия породила это собрание миражей, которое привело к смерти многих. Легенды гласят, что когда запасы воды путников иссякают, здесь появляется пышный оазис. Фляги путешественников наполняются прохладной водой, которая затем сменяется горстями песка.",
                "faction": "Цари гробниц",
                "province": "Треснувшая земля",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2094,1400],
                "type":"Point"
            }
        },




        // ЗЕЛЕНОКОЖИЕ
        {
            "type":"Feature",
            "properties":{
                "runame":"Златлан",
                "engname": "Zlatlan",
                "traits": ["port"],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Южные джунгли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2442,570],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Юатек",
                "engname": "Yuatek",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Южные джунгли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2405,465],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Теотиква",
                "engname": "Teotiqua",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Золотой перевал",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2962,864],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Золотая Башня",
                "engname": "The Golden Tower",
                "traits": [],
                "description": "Древняя башня, облицованная чистым золотом, построенная, если верить легендам, безымянным эльфийским магом задолго до Катаклизма.",
                "faction": "Зеленокожие",
                "province": "Золотой перевал",
                "locationType": "fort"
            },
            "geometry":{
                "coordinates": [2722,909],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Храм Черепов",
                "engname": "Temple of Skulls",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Звериное царство",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [3084,1145],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Проклятые джунгли",
                "engname": "The Cursed Jungle",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Звериное царство",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2975,996],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Змеиный берег",
                "engname": "Serpent Coast",
                "traits": ["port"],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Звериное царство",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [3175,1013],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Кексотль",
                "engname": "Cuexotl",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Центральные джунгли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2560,778],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Солнечное Перелесье",
                "engname": "Sun-Tree Glades",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Центральные джунгли",
                "locationType": "pointOfInterest"
            },
            "geometry":{
                "coordinates": [2436,825],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Науонтль",
                "engname": "Nahuontl",
                "traits": ["port"],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Центральные джунгли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2250,680],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Тлаква",
                "engname": "Tlaqua",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Западные джунгли",
                "locationType": "city"
            },
            "geometry":{
                "coordinates": [2175,933],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Монолиты Мёртвой Головы",
                "engname": "Dead-Head Monoliths",
                "traits": ["port"],
                "description": "Говорят, если пройти между обсидиановыми головами монолитов в ночь, когда Моррслиб полон, они нашепчут тебе твою смерть.",
                "faction": "Зеленокожие",
                "province": "Западные джунгли",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [1991,929],
                "type":"Point"
            }
        },
        {
            "type":"Feature",
            "properties":{
                "runame":"Статуи богов",
                "engname": "Statues of The Gods",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Западные джунгли",
                "locationType": "shrine"
            },
            "geometry":{
                "coordinates": [2179,811],
                "type":"Point"
            }
        },


        {
            "type":"Feature",
            "properties":{
                "runame":"Стоянка Ореона",
                "engname": "Oreon's Camp",
                "traits": [],
                "description": "",
                "faction": "Зеленокожие",
                "province": "Сердце джунглей",
                "locationType": "camp"
            },
            "geometry":{
                "coordinates": [2563,1000],
                "type":"Point"
            }
        },



        {
            "type":"Feature",
            "properties":{
                "runame":"Залив Горечи",
                "engname": "Bitter Bay",
                "traits": ["port"],
                "description": "Заброшенное поселение в сердце поражённых вампирской скверной земель.",
                "province": "Сломанные зубы",
                "locationType": "town"
            },
            "geometry":{
                "coordinates": [3538,1867],
                "type":"Point"
            }
        },
    ]
}
