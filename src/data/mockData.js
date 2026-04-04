export const films = [
  {
    id: "1",
    title: "King of Boys",
    year: 2018,
    synopsis: "A ruthless businesswoman and underworld figure faces the consequences of a life built on crime and political power.",
    poster: "https://upload.wikimedia.org/wikipedia/en/e/eb/King_of_Boys_poster.jpeg",
    backdrop: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=1280&auto=format&fit=crop",
    genres: ["Thriller", "Crime", "Drama"],
    rating: 8.4,
    views: 4200000,
    runtime: 168,
    language: "English",
    nfvcb_rating: "18",
    status: "released",
    trailer_youtube_id: "abc123",
    director: "Kemi Adetiba",
    cast: ["Sola Sobowale", "Reminisce", "Toni Tones"]
  },
  {
    id: "2",
    title: "The Wedding Party",
    year: 2016,
    synopsis: "The wealthy Coker family hosts an extravagant wedding in Lagos — but everything that can go wrong, does.",
    poster: "https://upload.wikimedia.org/wikipedia/en/0/0d/Weddingparty.jpg",
    backdrop: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1280&auto=format&fit=crop",
    genres: ["Comedy", "Romance"],
    rating: 7.1,
    views: 6800000,
    runtime: 90,
    language: "English",
    nfvcb_rating: "PG",
    status: "released",
    director: "Kemi Adetiba",
    cast: ["Adesua Etomi", "Banky W", "Sola Sobowale"]
  },
  {
    id: "3",
    title: "Lionheart",
    year: 2018,
    synopsis: "A woman steps up to run her father's transport company while navigating family politics and male chauvinism.",
    poster: "https://upload.wikimedia.org/wikipedia/en/c/c8/Lionheart_%282018_film%29_poster.jpg",
    backdrop: "https://images.unsplash.com/photo-1554126807-6b10f6f6692a?q=80&w=1280&auto=format&fit=crop",
    genres: ["Drama", "Family"],
    rating: 6.8,
    views: 3100000,
    runtime: 95,
    language: "Igbo/English",
    nfvcb_rating: "PG",
    status: "released",
    director: "Genevieve Nnaji",
    cast: ["Genevieve Nnaji", "Pete Edochie", "Nkem Owoh"]
  },
  {
    id: "4",
    title: "October 1",
    year: 2014,
    synopsis: "On the eve of Nigeria's independence, a detective hunts a serial killer in a small town gripped by fear.",
    poster: "https://upload.wikimedia.org/wikipedia/en/4/4d/October1_movie_poster.jpg",
    backdrop: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1280&auto=format&fit=crop",
    genres: ["Thriller", "Crime", "Biography"],
    rating: 8.1,
    views: 2900000,
    runtime: 120,
    language: "Yoruba/English",
    nfvcb_rating: "15",
    status: "released",
    director: "Kunle Afolayan",
    cast: ["Sadiq Daba", "Kayode Odumosu", "Demola Adedoyin"]
  },
  {
    id: "5",
    title: "Omo Ghetto: The Saga",
    year: 2020,
    synopsis: "A street queen is forced out of retirement when her loved ones are threatened by a new power in the ghetto.",
    poster: "https://upload.wikimedia.org/wikipedia/en/f/f7/Omo_Ghetto_The_Saga_Poster.jpg",
    backdrop: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1280&auto=format&fit=crop",
    genres: ["Action", "Comedy", "Drama"],
    rating: 7.5,
    views: 5400000,
    runtime: 105,
    language: "Yoruba/Pidgin",
    nfvcb_rating: "15",
    status: "released",
    director: "Funke Akindele",
    cast: ["Funke Akindele", "Chioma Akpotha", "Eniola Badmus"]
  },
  {
    id: "6",
    title: "Shanty Town",
    year: 2023,
    synopsis: "A powerful drug lord rules a Lagos slum — but three women trapped in his empire are plotting his downfall.",
    poster: "https://upload.wikimedia.org/wikipedia/en/e/ef/Shanty_Town_%28TV_series%29.jpg",
    backdrop: "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?q=80&w=1280&auto=format&fit=crop",
    genres: ["Crime", "Thriller", "Drama"],
    rating: 7.9,
    views: 7200000,
    runtime: 300,
    language: "English/Pidgin",
    nfvcb_rating: "18",
    status: "released",
    director: "Charles Okpaleke",
    cast: ["Ini Edo", "Chidi Mokeme", "Nse Ikpe-Etim"]
  }
];

export const people = [
  {
    id: "1",
    name: "Funke Akindele",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Funke_Akindele_at_AMVCA_2020.jpg/960px-Funke_Akindele_at_AMVCA_2020.jpg",
    role: "Director / Actress",
    bio: "One of Nollywood's most commercially successful filmmaker-actresses.",
    film_count: 24,
    popularity: 12400000,
    is_verified: true
  },
  {
    id: "2",
    name: "Kunle Afolayan",
    photo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Kunle_Afolayan.jpg",
    role: "Director / Producer",
    bio: "CEO of Golden Effects Pictures. Known for culturally rich, high-quality Nigerian cinema.",
    film_count: 18,
    popularity: 9800000,
    is_verified: true
  },
  {
    id: "3",
    name: "Genevieve Nnaji",
    photo: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Genevieve_Nnaji_in_Weekend_Getaway.png",
    role: "Actress / Director",
    bio: "Nollywood icon and the first Nigerian filmmaker to be acquired by Netflix.",
    film_count: 31,
    popularity: 15600000,
    is_verified: true
  },
  {
    id: "4",
    name: "Kemi Adetiba",
    photo: "https://upload.wikimedia.org/wikipedia/commons/4/47/Kemi_Adetiba.png",
    role: "Director",
    bio: "Award-winning music video director turned filmmaker. Creator of the King of Boys franchise.",
    film_count: 8,
    popularity: 8200000,
    is_verified: true
  }
];

export const genres = [
  "Drama", "Comedy", "Thriller", "Romance",
  "Action", "Horror", "Crime", "Family",
  "Biography", "Documentary"
];
