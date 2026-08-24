export const APPS = [
  {
    id: "preview-studio",
    name: "LINK Preview Studio",
    project: "playgroundlink",
    vercelProjectId: "prj_JkPKVfpvAzxxuPF7NPi1x0KvB7fH",
    domain: "https://playgroundlink.vercel.app",
    group: "LINK",
    kind: "Captación comercial / prototipos",
    description: "Entrada comercial de LINK: prototipos, oferta digital y conversión de prospectos.",
    accent: "PS",
    healthPath: "/",
    github: "gonzalogaraymunoz-star/LINK-PREVIEW-STUDIO",
    capabilities: ["preview", "leads", "sales"]
  },
  {
    id: "linkvoice",
    name: "LINK Voice",
    project: "linkvoice",
    vercelProjectId: "prj_xa5gzop02IKLLdL2TiXNhkWLf3Xz",
    domain: "https://linkvoice-smoky.vercel.app",
    group: "LINK",
    kind: "Producto de voz",
    description: "Entorno experimental de voz y experiencias conversacionales de LINK.",
    accent: "VO",
    healthPath: "/",
    github: "gonzalogaraymunoz-star/LINKVOICE",
    capabilities: ["voice", "ai"]
  },
  {
    id: "link-translate",
    name: "LINK Translate",
    project: "link-translate",
    vercelProjectId: "prj_FEiHQlIUZNqehumbxt4xdEyZN5QE",
    domain: "https://link-translate.vercel.app",
    group: "LINK",
    kind: "Producto de traducción",
    description: "Herramienta LINK para traducción y asistencia multilingüe.",
    accent: "TR",
    healthPath: "/",
    github: "gonzalogaraymunoz-star/LINK-TRANSLATE",
    capabilities: ["translation", "ai"]
  },
  {
    id: "hotel-experience",
    name: "Hotel Experience",
    project: "hotel-experience",
    vercelProjectId: "prj_m4p0v2jWBcekHwJjkbUR80ZD04y6",
    domain: "https://hotel-experience.vercel.app",
    group: "Clientes",
    kind: "Plataforma hotelera",
    description: "Proyecto principal de experiencia hotelera y captación de pasajeros.",
    accent: "HX",
    healthPath: "/",
    github: "gonzalogaraymunoz-star/HOTEL-EXPERIENCE1",
    capabilities: ["hotel", "leads", "crm"]
  },
  {
    id: "hotel-experience-11",
    name: "Hotel Experience 11",
    project: "hotel-experience-11",
    vercelProjectId: "prj_RK5KDLs0QS2fv1XAgbOdBwYDJOKK",
    domain: "https://hotel-experience-11.vercel.app",
    group: "Labs",
    kind: "Versión alternativa",
    description: "Segundo deployment del proyecto Hotel Experience. Debe compararse con la versión principal antes de retirarlo.",
    accent: "H2",
    healthPath: "/",
    github: "gonzalogaraymunoz-star/HOTEL-EXPERIENCE1",
    capabilities: ["hotel", "test"]
  },
  {
    id: "lama-travelers",
    name: "Lama Travelers",
    project: "lamatravelers-com",
    vercelProjectId: "prj_eArRV1WfZ1U2dHgp7iqO8yqsXn7U",
    domain: "https://lamatravelers-com.vercel.app",
    group: "Clientes",
    kind: "Proyecto cliente",
    description: "Sitio y producto digital de Lama Travelers.",
    accent: "LT",
    healthPath: "/",
    github: "gonzalogaraymunoz-star/lamatravelers.com",
    capabilities: ["travel", "website"]
  },
  {
    id: "propuesta",
    name: "Propuesta",
    project: "propuesta",
    vercelProjectId: "prj_1a6b7uNloN7RaSCcc2pFs5yVAYzO",
    domain: "https://propuesta-nine.vercel.app",
    group: "Operación",
    kind: "Herramienta comercial",
    description: "Entorno para propuestas y demostraciones comerciales.",
    accent: "PR",
    healthPath: "/",
    github: "gonzalogaraymunoz-star/propuesta",
    capabilities: ["sales", "proposal"]
  },
  {
    id: "lama-test",
    name: "Lama Test",
    project: "lama-test",
    vercelProjectId: "prj_pPqeR0loGuyRA7HQpYpcKOen2GNn",
    domain: "https://lama-test.vercel.app",
    group: "Labs",
    kind: "Sandbox",
    description: "Entorno de pruebas de Lama.",
    accent: "L1",
    healthPath: "/",
    github: null,
    capabilities: ["test"]
  },
  {
    id: "lama-schema-test",
    name: "Lama Schema Test",
    project: "lama-schema-test",
    vercelProjectId: "prj_IsQlTTgE2WtmBgT5pkH0QZOlgbpT",
    domain: "https://lama-schema-test-gonzalogaraymunoz-8382s-projects.vercel.app",
    group: "Labs",
    kind: "Prueba de esquema",
    description: "Proyecto técnico de pruebas; su último deployment observado estaba en error.",
    accent: "LS",
    healthPath: "/",
    github: null,
    capabilities: ["schema", "test"]
  }
];

export function publicApps() {
  return APPS.map(({ healthPath, vercelProjectId, ...app }) => app);
}

export function appById(id) {
  return APPS.find((app) => app.id === id);
}
