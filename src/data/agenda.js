export const agenda = {
  day1: {
    title: "Day 1 · Arrival & Old Town",
    stops: [
      {
        id: "gathering-pochentong",
        name: "Gathering at TotalEnergies Pochentong",
        time: "8:00 AM",
        type: "sight",
        image: "/images/Gathering_Total.jpg",
        tag: "Gathering",
        description: "Gathering at the TotalEnergies Pochentong station. Please complete your breakfast beforehand. **The motor trip officially starts at 8:20 AM.**",
        mapLink: "https://maps.app.goo.gl/guUS11jMj2Mxf6YUA",
        align: "right"
      },
      {
        id: "drive-to-kompot",
        isDistBadge: true,
        text: "~3.5 hours drive to Kompot"
      },
      {
        id: "arrival-kompot",
        name: "Welcome to Kompot Town!",
        time: "11:40 AM",
        type: "sight",
        image: "/images/welcome_kompot.jpg",
        tag: "Arrival",
        description: "Arrive in the salt and pepper capital. We'll take a quick break at the famous Durian Roundabout before heading to our stay.",
        mapLink: "https://maps.app.goo.gl/9Z8H96R9X8Z6Z8Z6Z",
        align: "left"
      },
      {
        id: "dropoff-stay",
        name: "Drop off stuff @សហគមន៍អេកូទេសចរណ៍នេសាទកំពង់សាមគ្គី",
        time: "12:00 PM",
        type: "hotel",
        image: "/images/dropoff.jpg",
        tag: "Hotel · Drop-off",
        description: "Quickly drop off your bags and gear at the community guesthouse before heading out for lunch and afternoon adventures.",
        mapLink: "https://maps.app.goo.gl/zNVzWTPsyoEbLRf96",
        align: "right"
      },
      {
        id: "kep-market",
        name: "Shopping @Kep Crab Market",
        time: "12:45 PM",
        type: "sight",
        image: "/images/kep_market.jpg",
        tag: "Shopping",
        description: "Visit the legendary crab market to hand-pick the freshest blue swimmer crabs and other seafood for our lunch.",
        mapLink: "https://maps.app.goo.gl/ohT1jATVb9gGGJvh7",
        align: "left"
      },
      {
        id: "kep-lunch",
        name: "Seafood Feast @Kep Eating Area",
        time: "1:30 PM",
        type: "dinner",
        image: "/images/kep_lunch.jpg",
        tag: "Lunch",
        description: "Enjoy our fresh catch prepared with famous Kampot pepper while overlooking the ocean. The ultimate Kep seafood experience.",
        mapLink: "https://maps.app.goo.gl/H7avZVcou2bD6zjW6",
        align: "right"
      }
    ]
  },
  day2: {
    title: "Day 2 · Beach & Kep Border",
    stops: [
      {
        id: "morning-magic",
        name: "Morning Magic & Sunrise",
        time: "6:00 AM",
        type: "sight",
        image: "/images/sunrise.jpg",
        tag: "Morning Gathering",
        description: "Please enjoy the peaceful atmosphere at **សហគមន៍អេកូទេសចរណ៍នេសាទកំពង់សាមគ្គី**. Let's gather to watch the sunrise together if possible! **Note:** If you'd like coffee, please bring your own from home.",
        align: "left"
      },
      {
        id: "breakfast-spot",
        name: "Breakfast — Choose a Spot",
        time: "8:30 AM",
        type: "dinner",
        tag: "Breakfast",
        isBreakfast: true,
        align: "right",
        panels: [
          {
            id: "bfast1",
            label: "ហាងបាយ អ៊ីហួយ (Ei Houy)",
            img: "/images/ei_houy.jpg",
            btnLabel: "① Ei Houy",
            desc: "🍗 Famous for their silky **chicken rice** — perfectly seasoned, fall-off-the-bone tender, and absolutely delicious. A must-try Kompot morning classic!",
            mapLink: "https://maps.app.goo.gl/NJjZDwUNYig3KNsAA"
          },
          {
            id: "bfast2",
            label: "បាយប៊ីអុីម៉ៃ (Bai Bi Im Mai)",
            img: "/images/im_mai.jpg",
            btnLabel: "② Im Mai",
            desc: "💰 Budget-friendly and no rush — **cheap prices**, plenty of seats, and a relaxed vibe. Great for the whole group to sit and enjoy a slow morning meal together.",
            mapLink: "https://maps.app.goo.gl/x3rmpFkwjC17BZEk6"
          },
          {
            id: "bfast3",
            label: "Oeng Kimse Restaurant",
            img: "/images/oeng_kimse.jpg",
            btnLabel: "③ Kimse",
            desc: "🦀 Our Kompot go-to! We **always order the crab fried rice** here — fragrant, packed with fresh crab, and cooked just right. A trip to Kompot isn't complete without it.",
            mapLink: "https://maps.app.goo.gl/KsvgwrMD3keaTAxU6"
          }
        ]
      },
      {
        id: "bokor-park",
        name: "Bokor National Park",
        time: "9:30 AM",
        type: "sight",
        image: "/images/bokor.jpg",
        tag: "Nature",
        description: "Explore the misty highlands of Bokor — ancient French colonial ruins, sweeping views over the Gulf of Thailand, and cool mountain air make this one of Cambodia's most dramatic landscapes.",
        mapLink: "https://maps.app.goo.gl/eyxPaq1bqi5TyMUy5",
        align: "left"
      }
    ]
  }
};
