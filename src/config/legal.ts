/**
 * legal.ts — Textos legales y posicionamiento juridico
 *
 * eFPear CertiCalc es un proyecto PRIVADO de caracter ORIENTATIVO.
 * Todos los textos legales deben reflejar esta posicion.
 *
 * Principios:
 * 1. Sin valor legal/administrativo — no es certificacion ni habilitacion
 * 2. Interpretacion automatizada — puede contener errores o estar desactualizada
 * 3. Consultar siempre normativa vigente y organo competente
 * 4. Proyecto privado — no vinculado a institucion publica
 * 5. GDPR by design — cero datos personales en servidor, todo local
 */

export const LEGAL = {
  /** Disclaimer corto para footer */
  footerShort: 'Herramienta orientativa de uso privado. Sin valor legal ni administrativo. Consulte siempre normativa vigente.',

  /** Disclaimer medio para banners */
  bannerMedium: 'eFPear CertiCalc es un proyecto privado de uso personal. Los resultados son estimaciones basadas en la interpretacion automatizada de normativa publicada en el BOE y no tienen valor legal ni administrativo. La habilitacion oficial la determina exclusivamente el organo competente.',

  /** Disclaimer largo para pagina legal / modal de info */
  disclaimerFull: `eFPear CertiCalc es una herramienta de software de caracter privado, desarrollada con fines orientativos y de apoyo a la planificacion docente en el ambito de la Formacion Profesional para el Empleo (FPE).

LIMITACION DE RESPONSABILIDAD:
Los resultados generados por esta herramienta — incluyendo pero no limitado a: evaluaciones de elegibilidad, distribuciones pedagogicas, situaciones de aprendizaje, y calendarios formativos — son estimaciones automatizadas basadas en la interpretacion de normativa publicada en el Boletin Oficial del Estado (BOE) y otras fuentes publicas.

Dichos resultados NO constituyen:
- Certificacion ni habilitacion profesional.
- Resolucion administrativa de ningun tipo.
- Asesoramiento juridico vinculante.
- Documentacion oficial valida ante la Administracion.

La determinacion oficial de la elegibilidad para impartir modulos formativos, asi como la aprobacion de programaciones didacticas, corresponde EXCLUSIVAMENTE al organo competente de la Administracion (Servicio Publico de Empleo o autoridad autonomica equivalente).

DATOS PERSONALES:
eFPear CertiCalc opera integramente en el navegador del usuario. No se transmiten, almacenan ni procesan datos personales en ningun servidor externo. Toda la informacion introducida permanece en el dispositivo local del usuario (IndexedDB). Cumplimiento RGPD/GDPR por diseno.

NORMATIVA DE REFERENCIA:
- Real Decreto que regula cada Certificado de Profesionalidad.
- Normativa general de Formacion Profesional para el Empleo.
- Orden ESS/1897/2013, de 10 de octubre (requisitos de formadores).

Se recomienda SIEMPRE consultar la normativa vigente y contactar con la entidad acreditadora antes de tomar decisiones basadas en los resultados de esta herramienta.`,

  /** Posicionamiento del proyecto */
  projectPositioning: {
    tipo: 'Proyecto privado',
    caracter: 'Orientativo',
    vinculoInstitucional: 'Ninguno',
    datosPersonales: 'Cero — 100% local (IndexedDB)',
    responsabilidad: 'El usuario asume la responsabilidad de verificar los resultados con las fuentes oficiales.',
  },
} as const;
