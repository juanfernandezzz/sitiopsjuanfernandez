/**
 * Texto canonico del asentimiento informado para personas menores de 18 anios
 * (Ley 21.541 Telemedicina, Ley 20.584 derechos en la atencion de salud,
 * Ley 21.719 proteccion de datos). Se usa identico en el componente UI y en el
 * PDF generado.
 *
 * Estructura legal: el adolescente ASIENTE (Parte A, lenguaje acorde a su edad)
 * y el adulto responsable AUTORIZA (Parte B, lenguaje legal). La firma legalmente
 * operativa es la del adulto responsable.
 *
 * CRITICO: cero em-dashes y cero en-dashes. Separar clausulas con dos puntos,
 * comas o parentesis.
 */

export const TEXTO_ASENTIMIENTO = `ASENTIMIENTO INFORMADO Y AUTORIZACIÓN DEL ADULTO RESPONSABLE PARA ATENCIÓN PSICOLÓGICA ONLINE (PERSONAS MENORES DE 18 AÑOS)

PARTE A. PARA TI (si tienes menos de 18 años)

Antes de empezar quiero contarte cómo funciona, para que decidas con tranquilidad.

Qué es: conversamos por videollamada, 45 minutos cada vez, en un lugar privado. Mi trabajo es acompañarte.

Es tu decisión: participar es voluntario. Puedes preguntar lo que quieras y decir si algo no te acomoda. Si en algún momento no quieres seguir, puedes decirlo.

Lo que hablamos es privado: queda entre nosotros. Solo hay algunas excepciones que la ley me obliga a compartir, por ejemplo si tu vida o la de otra persona está en peligro, o si alguien te está haciendo daño. En esos casos hablo con tu adulto responsable y con quien pueda ayudar, y siempre te aviso antes.

Tu adulto responsable: para empezar también necesito el permiso de tu papá, mamá o quien te cuida. Ellos saben que estás en terapia y participan en lo importante, pero no les cuento el detalle de cada conversación.

PARTE B. AUTORIZACIÓN DEL ADULTO RESPONSABLE

1. Naturaleza del servicio. Autorizo que el adolescente a mi cargo reciba atención psicológica con Juan Fernández, Psicólogo Clínico, en modalidad de telemedicina (sesiones por videollamada de 45 minutos) a través de la plataforma Doxy.me, certificada por el Fondo Nacional de Salud (Fonasa) para esta finalidad.

2. Marco legal. Comprendo que esta atención se rige por la Ley N° 21.541 (Telemedicina), la Ley N° 20.584 (derechos y deberes de las personas en su atención de salud), la Ley N° 21.331 (derechos de las personas en la atención de salud mental) y el Código de Ética del Colegio de Psicólogas y Psicólogos de Chile. En mi calidad de madre, padre o representante legal, autorizo el tratamiento conforme al interés superior del adolescente.

3. Asentimiento del adolescente. Declaro que el contenido de este documento fue explicado al adolescente en un lenguaje acorde a su edad y desarrollo, y que ha expresado su acuerdo de participar. Su opinión será considerada durante todo el proceso.

4. Limitaciones de la modalidad online. Entiendo que la atención online no reemplaza una atención de urgencia. Ante una crisis o riesgo vital debo contactar Salud Responde (600 360 7777) o acudir a la urgencia más cercana.

5. Confidencialidad y su alcance con personas menores de edad. La información compartida es confidencial. Para preservar el vínculo terapéutico, no se entregará al adulto responsable el detalle de cada sesión, salvo lo necesario para el cuidado del adolescente. Existen excepciones que la ley obliga a informar: riesgo grave para el adolescente o terceros, sospecha de vulneración de derechos o abuso, y requerimiento judicial. Las sesiones NO son grabadas.

6. Protección de datos. Los datos personales y de salud del adolescente serán tratados conforme a la Ley 19.628 sobre Protección de la Vida Privada y a la Ley 21.719 sobre Protección de Datos Personales (vigencia plena a partir del 1 de diciembre de 2026), que contempla resguardos reforzados para datos de niños, niñas y adolescentes.

7. Honorarios. Acepto el valor informado al momento de agendar ($15.000 particular o $5.570 con bono Fonasa MLE). Con bono Fonasa, debo entregar el folio antes de la sesión.

8. Cancelaciones. Puedo cancelar o reagendar hasta 6 horas antes sin costo. Cancelaciones con menos de 6 horas se reagendan caso a caso.

9. Voluntariedad. La participación es voluntaria y puede discontinuarse en cualquier momento, considerando la opinión del adolescente.

DECLARA EL ADULTO RESPONSABLE:
[X] Ser madre, padre o representante legal del adolescente
[X] Haber leído y comprendido este documento
[X] Haber explicado su contenido al adolescente y contar con su acuerdo de participar
[X] Autorizar la atención psicológica online y comprender sus limitaciones`;

export const CHECKBOXES_ASENTIMIENTO = [
  'Soy madre, padre o representante legal del adolescente',
  'He leído y comprendido este asentimiento y autorización',
  'Le expliqué su contenido al adolescente y cuenta con su acuerdo de participar',
  'Autorizo la atención psicológica online y comprendo sus limitaciones (no es servicio de urgencia)',
];
