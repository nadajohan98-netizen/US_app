// Default avatar presets shown in the profile editor.
// "y que de predeterminada tengas que elegir animales o personajes animados, o publicar tu propia foto"

export interface AvatarPreset {
  name: string;
  url: string;
}

export const ANIMAL_PRESETS: AvatarPreset[] = [
  {
    name: 'Panda Bebé 🐼',
    url: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gatito Adorable 🐱',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cachorro Alegre 🐶',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Conejo Dulce 🐰',
    url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Koala Chibi 🐨',
    url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Zorrito Tímido 🦊',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=160&auto=format&fit=crop&q=80',
  },
];

export const CHARACTER_PRESETS: AvatarPreset[] = [
  {
    name: 'Anime Chibi ✨',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Estrella Pop 👩‍🎤',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Aventurero Gamer 🧑‍🚀',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Caballero Retro 🎩',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mago Misterioso 🔮',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
  },
  {
    name: 'Astronauta Estelar 🚀',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=160&auto=format&fit=crop&q=80',
  },
];
