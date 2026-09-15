/**
 * lib/graphicsQuote.js — the /graphics order desk's options and copy.
 *
 * Same arrangement as lib/graphics.js: the content lives here, the component
 * takes it as props, and nothing is written into JSX. What is different is
 * that three of these lists are not editorial choices — they are a CONTRACT.
 *
 * ⚑ DELIVERY_TYPES and DELIVERY_TIMES are enumerated on the server, in
 * str-backend/src/models/GraphicsQuote.js, and validated against on every
 * submission. The strings must match CHARACTER FOR CHARACTER, including the
 * parentheses and the capital H in "6 Hour". A mismatch does not degrade
 * gracefully: the option renders perfectly, the client fills the whole form,
 * and the POST comes back 400 on a field they cannot see anything wrong with.
 *
 * The limits below are mirrored from env.quote on the server for the same
 * reason the inquiry form mirrors express-validator: to fail in the browser,
 * before a client waits out a 15MB upload only to be told it was too big. The
 * server's numbers are the real ones — these exist to be kind, not to be
 * authoritative.
 */

export const DELIVERY_TYPES = [
    "Save with original file/format",
    "JPEG (flattened)",
    "PNG with transparency",
    "TIFF with clipping path",
    "PSD, layered",
];

export const DELIVERY_TIMES = ["6 Hour", "12 Hour", "24 Hour", "48 Hour", "3+ Days"];

/** Mirrors env.quote on the API. Raise there first, then here. */
export const UPLOAD_LIMITS = {
    maxFiles: 5,
    maxFileBytes: 5 * 1024 * 1024,
    maxTotalBytes: 15 * 1024 * 1024,
};

/**
 * Extensions the intake accepts, as the `accept` attribute and as the line
 * printed under the drop zone.
 *
 * ⚑ `accept` is a file-picker filter, not a guarantee. It is advisory in every
 * browser and trivially bypassed by drag and drop, which is precisely why the
 * server checks the declared mime type as well. Listing it here is a
 * convenience for the client's file dialog and nothing more.
 */
export const ACCEPTED_FILES =
    ".jpg,.jpeg,.png,.webp,.avif,.gif,.tif,.tiff,.psd,.psb,.ai,.eps,.pdf,.zip,.rar,.7z,.cr2,.nef,.arw,.dng,.raf,.heic";

export const ACCEPTED_LABEL = "JPG, PNG, TIFF, PSD, RAW, PDF or a zip";

/**
 * The three lines beside the form. Written as an ordered promise, not as
 * features: a client sending files to a studio they have not worked with
 * wants to know what happens to them and when they hear back, in that order.
 */
export const ORDER_STEPS = [
    {
        title: "You send two or the whole batch",
        body: "Attach up to five files here, or paste a WeTransfer link if the catalogue runs to thousands. Either is a real order.",
    },
    {
        title: "An editor prices your own photography",
        body: "Not the table above. The rate card is the starting point; what your images actually need is quoted against the files you sent.",
    },
    {
        title: "The quote comes back within one business day",
        body: "With the turnaround confirmed. Nothing is charged and no work starts until you reply to it.",
    },
];

/**
 * The file-handling note under the drop zone.
 *
 * Kept as copy rather than as a generic privacy line because it is specific
 * and true: quoteUpload.js on the API holds the bytes in memory for one
 * request, attaches them to the studio's notification and drops them. Nothing
 * is written to a public folder, so there is no URL for anyone to find.
 */
export const FILE_NOTE =
    "Files go straight to the graphics desk as an email attachment. Nothing is stored on a public server and no link to your artwork is ever generated.";
