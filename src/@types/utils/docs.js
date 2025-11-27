/**
 * The utils module gathers shared helper types for JSON parsing, hashing, and
 * packet encoding.
 * @packageDocumentation
 * @module utils
 * @since v0.0.0
 */
/// utils

/**
 * The jsonString function converts an unknown value to a normalized JSON
 * string.
 *
 * This function provides deterministic JSON serialization by sorting
 * object keys alphabetically, ensuring that equivalent objects always
 * produce identical string representations. This is essential for generating
 * consistent hashes and comparing data structures.
 * @param value The value to serialize.
 * @returns A JSON string with sorted keys.
 * @category Utility
 * @since v0.0.0
 */
/// jsonString

/**
 * The jsonParse function parses a JSON string that may have come from
 * jsonString.
 *
 * This is a wrapper around JSON.parse that provides type safety and handles
 * potential parsing errors gracefully. Use this to deserialize strings
 * created by jsonString.
 * @param json The JSON string to parse.
 * @returns The parsed value.
 * @category Utility
 * @since v0.0.0
 */
/// jsonParse

/**
 * The getUniqueId function generates a unique ID string of the requested
 * length.
 *
 * This function creates cryptographically random identifiers suitable for
 * use as Synclet addresses or other unique identifiers. The generated IDs are
 * URL-safe and contain characters from the set [A-Za-z0-9_-].
 * @param length The number of characters in the ID.
 * @returns A random unique ID string.
 * @category Utility
 * @since v0.0.0
 */
/// getUniqueId

/**
 * The getHash function produces a Hash for a given string payload.
 *
 * This function generates a deterministic hash value used in Merkle tree
 * construction for efficient synchronization. The hash is computed using a
 * fast, non-cryptographic algorithm suitable for detecting data changes.
 * @param payload The string to hash.
 * @returns A Hash string representing the payload.
 * @category Utility
 * @since v0.0.0
 */
/// getHash

/**
 * The isTimestamp function is a type guard that identifies Timestamp values.
 *
 * This function checks whether a value conforms to the Timestamp structure,
 * which is a tuple containing a Hybrid Logical Clock (HLC) timestamp. Use
 * this for runtime validation of timestamp data before processing.
 * @param value The value to test.
 * @returns True if the value is a valid Timestamp.
 * @category Utility
 * @since v0.0.0
 */
/// isTimestamp

/**
 * The isAtom function is a type guard that identifies Atom values.
 *
 * This function checks whether a value conforms to the Atom structure,
 * which is a tuple containing a value and its HLC timestamp. Use this for
 * runtime validation of atom data before processing.
 * @param value The value to test.
 * @returns True if the value is a valid Atom.
 * @category Utility
 * @since v0.0.0
 */
/// isAtom

/**
 * The getPartsFromPacket function splits a packet into the destination and
 * body parts.
 *
 * This function deserializes a packet string received over a transport back
 * into its constituent parts: the destination address and the message body.
 * Use this when implementing custom transport receive handlers.
 * @param packet The packet string to parse.
 * @returns A tuple of [destination, body].
 * @category Utility
 * @since v0.0.0
 */
/// getPartsFromPacket

/**
 * The getPacketFromParts function encodes a destination and body into a
 * packet string.
 *
 * This function serializes a destination address and message body into a
 * packet format suitable for transmission over a transport. Use this when
 * implementing custom transport send handlers.
 * @param destination The destination address.
 * @param body The message body.
 * @returns A packet string ready for transmission.
 * @category Utility
 * @since v0.0.0
 */
/// getPacketFromParts
