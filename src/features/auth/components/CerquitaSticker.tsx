import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { colors } from '@/shared/ui';

export type CerquitaStickerProps = {
  width: number;
  height: number;
};

const WORDMARK_BASELINE_Y = 184;
const WORDMARK_SCALE = 0.03125; // 64px / 2048 unitsPerEm (Inter)

/**
 * Contornos del wordmark "cerquıta" (Inter 800 ExtraBold, 64px,
 * letter-spacing -1.28, x inicial 255) -- extraídos directo del `.ttf` con
 * `fontTools` (`SVGPathPen`), NO renderizados con `<Text>` de
 * react-native-svg: sus métricas de fuente difieren entre Android/iOS (bug
 * real de gate visual -- el pin caía sobre la "t" en Android, sobre la ı
 * en iOS, ver docs/phases/chore-brand-v2-login-splash.md). Un `<Path>` es
 * geometría fija, idéntica en cualquier plataforma -- cero dependencia de
 * cómo cada SO mide texto. `x` de cada glifo ya incluye el avance +
 * letter-spacing acumulado del carácter anterior.
 */
const WORDMARK_GLYPHS: { char: string; x: number; d: string }[] = [
  {
    char: 'c',
    x: 255,
    d: 'M634 -21Q459 -21 333.0 51.5Q207 124 139.5 253.5Q72 383 72 555Q72 728 139.5 857.5Q207 987 333.0 1059.5Q459 1132 634 1132Q741 1132 830.0 1104.0Q919 1076 986.0 1024.5Q1053 973 1094.5 899.5Q1136 826 1149 735L827 681Q819 725 802.5 759.0Q786 793 762.5 817.0Q739 841 707.5 853.0Q676 865 638 865Q571 865 524.0 828.5Q477 792 452.5 722.5Q428 653 428 557Q428 461 452.5 391.0Q477 321 524.0 283.5Q571 246 638 246Q677 246 708.0 258.5Q739 271 763.5 295.5Q788 320 804.5 355.5Q821 391 828 436L1150 384Q1137 290 1095.5 215.5Q1054 141 987.0 88.0Q920 35 830.5 7.0Q741 -21 634 -21Z',
  },
  {
    char: 'e',
    x: 291.81,
    d: 'M636 -21Q461 -21 334.0 48.5Q207 118 139.5 247.0Q72 376 72 555Q72 727 139.5 857.0Q207 987 331.0 1059.5Q455 1132 623 1132Q741 1132 839.5 1095.0Q938 1058 1010.5 985.5Q1083 913 1122.5 807.0Q1162 701 1162 562V474H196V677H996L833 629Q833 707 809.5 763.0Q786 819 740.0 849.0Q694 879 626 879Q558 879 511.0 848.5Q464 818 439.5 763.5Q415 709 415 636V490Q415 404 443.5 346.5Q472 289 523.0 260.5Q574 232 642 232Q689 232 727.5 245.0Q766 258 793.5 284.0Q821 310 835 347L1146 296Q1118 200 1049.5 128.5Q981 57 876.5 18.0Q772 -21 636 -21Z',
  },
  {
    char: 'r',
    x: 328.97,
    d: 'M115 0V1118H454V914H466Q496 1025 565.5 1078.5Q635 1132 727 1132Q751 1132 777.5 1129.0Q804 1126 826 1120V816Q801 825 760.5 829.5Q720 834 688 834Q624 834 573.0 805.5Q522 777 493.0 727.0Q464 677 464 610V0Z',
  },
  {
    char: 'q',
    x: 354.57,
    d: 'M1190 -418H842V181H834Q812 131 770.5 86.0Q729 41 667.5 12.5Q606 -16 520 -16Q396 -16 294.0 48.5Q192 113 132.0 240.5Q72 368 72 558Q72 754 134.5 881.5Q197 1009 298.5 1070.5Q400 1132 517 1132Q606 1132 669.0 1101.5Q732 1071 772.5 1024.0Q813 977 834 926H846V1118H1190ZM639 256Q705 256 752.5 293.5Q800 331 825.0 399.0Q850 467 850 558Q850 651 825.0 718.5Q800 786 752.5 822.5Q705 859 639 859Q572 859 525.5 821.5Q479 784 455.0 716.5Q431 649 431 558Q431 468 455.0 399.5Q479 331 525.5 293.5Q572 256 639 256Z',
  },
  {
    char: 'u',
    x: 394.1,
    d: 'M503 -14Q386 -14 298.5 38.0Q211 90 163.0 185.0Q115 280 115 406V1118H464V474Q464 380 512.5 326.5Q561 273 646 273Q704 273 746.5 297.5Q789 322 813.0 368.5Q837 415 837 480V1118H1186V0H858L852 282H867Q825 148 737.0 67.0Q649 -14 503 -14Z',
  },
  {
    char: 'ı',
    x: 433.48,
    d: 'M115 0V1118H464V0Z',
  },
  {
    char: 't',
    x: 450.32,
    d: 'M718 1118V859H20V1118ZM168 1384H517V342Q517 298 538.0 276.5Q559 255 606 255Q624 255 656.5 259.0Q689 263 703 267L748 13Q689 -4 634.0 -10.0Q579 -16 530 -16Q352 -16 260.0 67.5Q168 151 168 311Z',
  },
  {
    char: 'a',
    x: 473.48,
    d: 'M428 -20Q321 -20 237.5 16.5Q154 53 107.0 126.5Q60 200 60 310Q60 403 92.5 467.0Q125 531 183.0 571.0Q241 611 316.0 632.0Q391 653 476 660Q571 668 629.0 677.5Q687 687 714.0 706.0Q741 725 741 759V763Q741 802 723.0 829.0Q705 856 671.0 870.0Q637 884 589 884Q541 884 503.5 870.0Q466 856 442.0 830.0Q418 804 408 769L92 810Q114 906 178.5 978.5Q243 1051 347.5 1091.5Q452 1132 592 1132Q696 1132 786.5 1107.5Q877 1083 945.0 1035.5Q1013 988 1051.0 918.5Q1089 849 1089 759V0H761V157H752Q722 99 675.5 60.0Q629 21 567.5 0.5Q506 -20 428 -20ZM534 211Q593 211 640.5 235.0Q688 259 716.0 301.0Q744 343 744 398V505Q729 497 706.5 490.0Q684 483 657.0 477.5Q630 472 603.0 467.5Q576 463 551 459Q500 452 464.0 435.0Q428 418 409.0 391.0Q390 364 390 326Q390 289 409.0 263.5Q428 238 460.0 224.5Q492 211 534 211Z',
  },
];

/**
 * Centro horizontal real de la ı (glifo "dotlessi") calculado por el mismo
 * script de extracción -- no el 438 a ojo del master, que asumía otra
 * fuente/métrica. El pin flota sobre este punto exacto en cualquier
 * plataforma.
 */
const PIN_CENTER_X = 442.54;

/**
 * Transcripción 1:1 de assets/brand/sticker-8b.svg a react-native-svg --
 * a propósito NO rasterizada: evita la trampa de fuente del rasterizador
 * (ver docs/phases/chore-brand-v2-login-splash.md, esa sí aplica solo al
 * splash) y queda nítida en cualquier densidad.
 */
export function CerquitaSticker({ width, height }: CerquitaStickerProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 640 320">
      <G transform="rotate(-5 320 160)">
        <Rect x={167} y={107} width={420} height={142} rx={71} fill={colors.brand.shadow} />
        <Rect x={150} y={90} width={420} height={142} rx={71} fill={colors.surface.default} />
        {WORDMARK_GLYPHS.map((glyph) => (
          <G
            key={glyph.char}
            transform={`translate(${glyph.x} ${WORDMARK_BASELINE_Y}) scale(${WORDMARK_SCALE} ${-WORDMARK_SCALE})`}
          >
            <Path d={glyph.d} fill={colors.brand.default} />
          </G>
        ))}
        <G transform={`translate(${PIN_CENTER_X} 121) scale(2.35)`}>
          <Path
            d="M 0 8 C -3.5 3.5 -5 1.5 -5 -1 A 5 5 0 1 1 5 -1 C 5 1.5 3.5 3.5 0 8 Z"
            fill={colors.brand.default}
          />
        </G>
        <G transform="rotate(8 116 161)">
          <Rect x={59} y={104} width={138} height={138} rx={42} fill={colors.brand.shadow} />
          <Rect
            x={47}
            y={92}
            width={138}
            height={138}
            rx={42}
            fill={colors.brand.default}
            stroke={colors.surface.default}
            strokeWidth={10}
          />
          <G transform="translate(57 102) scale(1.18)">
            <G transform="translate(34 52) rotate(7)">
              <Path
                d="M -10.5 11 L -10.5 -3 L 0 -11.5 L 10.5 -3 L 10.5 11 Z"
                fill="none"
                stroke={colors.surface.default}
                strokeWidth={8}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <Circle cx={0} cy={3.5} r={4} fill={colors.surface.default} />
            </G>
            <G transform="translate(67 49) rotate(-9)">
              <Path
                d="M 0 15 C -7 6.5 -10.5 2 -10.5 -3 A 10.5 10.5 0 1 1 10.5 -3 C 10.5 2 7 6.5 0 15 Z"
                fill="none"
                stroke={colors.surface.default}
                strokeWidth={8.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </G>
          </G>
        </G>
      </G>
    </Svg>
  );
}
