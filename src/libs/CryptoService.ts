/**
 * @file CryptoService.ts
 * @description A comprehensive, static utility class designed to perform a wide range of
 * cryptographic operations. This service centralizes common cryptographic primitives,
 * leveraging Node.js's built in `node:crypto` module to ensure security and performance.
 *
 * It provides methods for:
 * - **Hashing**: One way data transformation (e.g., SHA 256).
 * - **HMAC**: Hash based Message Authentication Codes for data integrity and authenticity.
 * - **Randomness**: Generation of cryptographically secure random bytes for salts, IVs, and keys.
 * - **Key Derivation**: Securely generating cryptographic keys from passwords (PBKDF2).
 * - **Symmetric Encryption**: Advanced Encryption Standard (AES 256 GCM) for confidential and authenticated data exchange.
 * - **Asymmetric Encryption**: RSA encryption and decryption for secure key exchange or small data encryption.
 *
 * This class prioritizes ease of use, consistency, and adherence to best practices in cryptography.
 */

/**
 * @description Imports a suite of cryptographic functions from Node.js's built in
 * `node:crypto` module. These functions and types are the foundation for all
 * cryptographic operations performed by this service.
 * @summary Imported functions and types:
 * - `createCipheriv`: Creates a cipher object for symmetric encryption.
 * - `createDecipheriv`: Creates a decipher object for symmetric decryption.
 * - `createHash`: Creates a hash object for one way hashing.
 * - `createHmac`: Creates a Message Authentication Code object.
 * - `generateKeyPairSync`: Generates an asymmetric key pair.
 * - `pbkdf2Sync`: Derives a key from a password.
 * - `privateDecrypt`: Decrypts data using a private key.
 * - `publicEncrypt`: Encrypts data using a public key.
 * - `randomBytes`: Generates cryptographically secure random data.
 * - `CipherGCM`, `DecipherGCM`, `KeyObject`: Types for cryptographic objects.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  generateKeyPairSync,
  pbkdf2Sync,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
  type KeyObject,
} from 'node:crypto';

/**
 * @description Imports the `Buffer` class from the Node.js `node:buffer` module.
 * This class is crucial for handling binary data streams, which are fundamental
 * to all cryptographic operations like encryption, hashing, and key management.
 */
import { Buffer } from 'node:buffer';

/**
 * @description Imports custom type definitions for the service's method signatures.
 * `IAesEncrypted` defines the structure for AES encrypted payloads, and `IRsaKeyPair`
 * defines the structure for an RSA key pair.
 */
import { type IAesEncrypted, type IRsaKeyPair } from '../types/libs/CryptoService';

/**
 * @class CryptoService
 * @description A comprehensive, static utility class designed to perform a wide range of
 * cryptographic operations. This service centralizes common cryptographic primitives,
 * leveraging Node.js's built in `node:crypto` module to ensure security and performance.
 */
export class CryptoService {
  /**
   * @private
   * @static
   * @readonly
   * @property {string} HASH_ALGO
   * @description Defines the default cryptographic hashing algorithm used for general purpose
   * hashing and HMAC generation throughout the service. The 'sha256' algorithm is a widely
   * accepted and secure choice for cryptographic hashing.
   * @default 'sha256'
   */
  private static readonly HASH_ALGO: string = 'sha256';

  /**
   * @private
   * @static
   * @readonly
   * @property {'aes-256-gcm'} AES_ALGO
   * @description Specifies the symmetric encryption algorithm for AES operations.
   * AES 256 in Galois/Counter Mode (GCM) is chosen for its provision of both
   * confidentiality (data secrecy) and authenticity (data integrity and origin verification).
   * It is considered a modern and highly secure mode of operation.
   * @default 'aes-256-gcm'
   */
  private static readonly AES_ALGO: 'aes-256-gcm' = 'aes-256-gcm';

  /**
   * @private
   * @static
   * @readonly
   * @property {number} AES_KEY_LENGTH
   * @description The mandated key length in bytes for AES 256 encryption. A 32 byte key
   * is equivalent to 256 bits, providing a high level of security that is resistant to
   * all known brute force attacks with current technology.
   * @default 32 (bytes)
   */
  private static readonly AES_KEY_LENGTH: number = 32;

  /**
   * @private
   * @static
   * @readonly
   * @property {number} AES_IV_LENGTH
   * @description The recommended Initialization Vector (IV) length in bytes for AES GCM.
   * A 16 byte (128 bit) IV ensures sufficient randomness and prevents IV reuse, which is
   * critical for maintaining the security of GCM mode.
   * @default 16 (bytes)
   */
  private static readonly AES_IV_LENGTH: number = 16;

  /**
   * @private
   * @static
   * @readonly
   * @property {number} PBKDF2_ITERATIONS
   * @description The number of iterations to perform during the Password Based Key
   * Derivation Function 2 (PBKDF2). A higher iteration count increases the computational
   * cost, significantly hindering brute force password attacks. This value should be
   * adjusted periodically based on computing power advancements.
   * @default 100000
   */
  private static readonly PBKDF2_ITERATIONS: number = 100000;

  /**
   * @private
   * @static
   * @readonly
   * @property {number} PBKDF2_SALT_LENGTH
   * @description The desired length in bytes for the salt used in PBKDF2 key derivation.
   * A sufficiently long and randomly generated salt is critical for preventing rainbow
   * table attacks and ensuring the uniqueness of derived keys for identical passwords.
   * @default 16 (bytes)
   */
  private static readonly PBKDF2_SALT_LENGTH: number = 16;

  /**
   * @private
   * @static
   * @readonly
   * @property {string} PBKDF2_DIGEST
   * @description The digest algorithm utilized internally by PBKDF2 for its underlying hash function.
   * 'sha512' is a strong choice that provides a high level of security.
   * @default 'sha512'
   */
  private static readonly PBKDF2_DIGEST: string = 'sha512';

  /**
   * @description Hashes the input data using the configured SHA 256 algorithm.
   * This method provides a one way cryptographic hash, transforming the input data
   * into a fixed size string (digest) that is computationally infeasible to reverse.
   * It's ideal for data integrity checks or password storage (when combined with salting).
   *
   * @public
   * @static
   * @method hash
   * @param {string} data The string data to be hashed.
   * @returns {string} The hexadecimal string representation of the generated SHA 256 hash.
   * @example
   * ```typescript
   * const dataToHash = 'sensitive information';
   * const hashedData = CryptoService.hash(dataToHash);
   * console.log(hashedData); // Output: 'b7e2c0d2e8f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4'
   * ```
   */
  public static hash(data: string): string {
    const hashGenerator = createHash(this.HASH_ALGO);
    hashGenerator.update(data);
    return hashGenerator.digest('hex');
  }

  /**
   * @description Generates a Hash based Message Authentication Code (HMAC) of the input data.
   * HMAC uses a cryptographic hash function (SHA 256) and a secret key to ensure
   * both the integrity and authenticity of a message. If the message or the key is
   * altered, the HMAC will change, indicating tampering.
   *
   * @public
   * @static
   * @method hmac
   * @param {string} data The data string to be authenticated.
   * @param {string | Buffer} key The secret key used for HMAC generation. This key
   * must be kept strictly confidential and shared only between the sender and receiver.
   * @returns {string} The hexadecimal string representation of the generated HMAC.
   * @example
   * ```typescript
   * const message = 'transaction details';
   * const secretKey = 'super-secret-hmac-key';
   * const messageHmac = CryptoService.hmac(message, secretKey);
   * console.log(messageHmac); // Output: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
   * ```
   */
  public static hmac(data: string, key: string | Buffer): string {
    const hmacGenerator = createHmac(this.HASH_ALGO, key);
    hmacGenerator.update(data);
    return hmacGenerator.digest('hex');
  }

  /**
   * @description Generates a specified number of cryptographically secure random bytes.
   * This method uses Node.js's `randomBytes` function, which is designed to produce
   * high quality random data suitable for all cryptographic purposes, such as
   * creating unique salts, Initialization Vectors (IVs), or secret keys.
   *
   * @public
   * @static
   * @method generateRandomBytes
   * @param {number} length The desired length of the random byte Buffer in bytes.
   * @returns {Buffer} A Buffer containing the cryptographically secure random bytes.
   * @example
   * ```typescript
   * const randomBytesBuffer = CryptoService.generateRandomBytes(32);
   * console.log(randomBytesBuffer.toString('hex'));
   * // Output: e.g., 'f3e2d1c0b9a876543210fedcba9876543210fedcba9876543210fedcba987654321'
   * ```
   */
  public static generateRandomBytes(length: number): Buffer {
    return randomBytes(length);
  }

  /**
   * @description Generates a cryptographically secure 256 bit (32 byte) key specifically
   * for AES 256 encryption. This key should be treated as highly confidential and managed securely.
   *
   * @public
   * @static
   * @method generateAesKey
   * @returns {Buffer} A 32 byte Buffer representing the generated AES 256 key.
   * @example
   * ```typescript
   * const aesKey = CryptoService.generateAesKey();
   * console.log(aesKey.toString('hex'));
   * // Output: e.g., '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
   * ```
   */
  public static generateAesKey(): Buffer {
    return this.generateRandomBytes(this.AES_KEY_LENGTH);
  }

  /**
   * @description Generates a cryptographically secure random salt of 16 bytes.
   * Salts are crucial for key derivation functions like PBKDF2 to prevent rainbow
   * table attacks and ensure that identical passwords result in different derived keys.
   * Each password should have a unique, randomly generated salt.
   *
   * @public
   * @static
   * @method generateSalt
   * @returns {Buffer} A 16 byte Buffer representing the generated salt.
   * @example
   * ```typescript
   * const salt = CryptoService.generateSalt();
   * console.log(salt.toString('hex')); // Output: e.g., 'abcdef0123456789abcdef0123456789ab'
   * ```
   */
  public static generateSalt(): Buffer {
    return this.generateRandomBytes(this.PBKDF2_SALT_LENGTH);
  }

  /**
   * @description Derives a cryptographic key from a password using the PBKDF2
   * (Password Based Key Derivation Function 2) algorithm. This function uses a
   * provided salt and a specified number of iterations to make brute force attacks
   * on the password computationally expensive. The derived key length is set to the
   * AES KEY LENGTH (32 bytes), making it suitable for AES 256. The salt used for
   * derivation must be stored securely alongside the derived key or hash.
   *
   * @public
   * @static
   * @method deriveKeyFromPassword
   * @param {string} password The user's password or passphrase from which to derive the key.
   * @param {Buffer} salt A unique, random salt (typically 16 bytes) generated using `generateSalt()`.
   * This salt must be stored with the user's data to be used for future verification/derivation.
   * @returns {Buffer} A 32 byte Buffer representing the cryptographically derived key.
   * @example
   * ```typescript
   * const userPassword = 'mySuperStrongPassword123!';
   * const userSalt = CryptoService.generateSalt(); // Store this salt with the user's record
   * const derivedKey = CryptoService.deriveKeyFromPassword(userPassword, userSalt);
   * console.log(derivedKey.toString('hex'));
   * // Output: e.g., '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
   * ```
   */
  public static deriveKeyFromPassword(password: string, salt: Buffer): Buffer {
    return pbkdf2Sync(
      password,
      salt,
      this.PBKDF2_ITERATIONS,
      this.AES_KEY_LENGTH,
      this.PBKDF2_DIGEST,
    );
  }

  /**
   * @description Encrypts plaintext data using the AES 256 GCM (Galois/Counter Mode) algorithm.
   * AES GCM provides **authenticated encryption**, meaning it guarantees both
   * **confidentiality** (the data is secret) and **authenticity** (the data has not
   * been tampered with and comes from the expected source). It generates a unique
   * Initialization Vector (IV) and an authentication tag for each encryption operation.
   *
   * @public
   * @static
   * @method encryptAES
   * @param {string} plaintext The string data to be encrypted.
   * @param {Buffer} key A 32 byte (256 bit) secret key. This key must be securely
   * managed and kept strictly confidential. Its length must match `AES_KEY_LENGTH`.
   * @returns {IAesEncrypted} An object containing the IV, encrypted data, and authentication tag,
   * all represented as hexadecimal strings. All three components are critically required
   * for successful decryption and authentication.
   * @throws {Error} Throws an `Error` if the provided `key` does not have the required
   * `AES_KEY_LENGTH` (32 bytes), indicating an invalid key for AES 256.
   * @example
   * ```typescript
   * const secretData = 'This is my top secret message.';
   * const encryptionKey = CryptoService.generateAesKey();
   * const encryptedResult = CryptoService.encryptAES(secretData, encryptionKey);
   * console.log(encryptedResult);
   * // Output:
   * // {
   * //   iv: '...',       // Hexadecimal string of the Initialization Vector
   * //   encryptedData: '...', // Hexadecimal string of the actual ciphertext
   * //   authTag: '...'      // Hexadecimal string of the authentication tag
   * // }
   * ```
   */
  public static encryptAES(plaintext: string, key: Buffer): IAesEncrypted {
    if (key.length !== this.AES_KEY_LENGTH) {
      throw new Error(`Invalid AES key length. Expected ${this.AES_KEY_LENGTH} bytes.`);
    }

    const iv: Buffer = this.generateRandomBytes(this.AES_IV_LENGTH);
    const cipher: CipherGCM = createCipheriv(this.AES_ALGO, key, iv);

    const encrypted: Buffer = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag: Buffer = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * @description Decrypts data that was previously encrypted using AES 256 GCM.
   * This method requires the original Initialization Vector (IV), the encrypted data,
   * the authentication tag, and the exact same secret key used during encryption.
   * The authentication tag is crucial: if it doesn't match, decryption will fail,
   * indicating either an incorrect key/IV or that the data has been tampered with.
   *
   * @public
   * @static
   * @method decryptAES
   * @param {IAesEncrypted} encryptedPayload An object containing the `iv`, `encryptedData`,
   * and `authTag` properties, all as hexadecimal strings, exactly as returned by `encryptAES`.
   * @param {Buffer} key The 32 byte (256 bit) secret key that was used for the encryption.
   * Its length must match `AES_KEY_LENGTH`.
   * @returns {string} The original plaintext string after successful decryption and authentication.
   * @throws {Error} Throws an `Error` if the provided `key` has an invalid length (not 32 bytes).
   * It will also throw an error (typically from `node:crypto`, like `ERR_OSSL_EVP_AEAD_TLS1_TAG_TOO_SHORT`)
   * if decryption fails due to an incorrect key, IV, authentication tag, or if the data
   * has been tampered with.
   * @example
   * ```typescript
   * const encryptionKey = CryptoService.generateAesKey();
   * const encryptedResult = CryptoService.encryptAES('my secret data', encryptionKey);
   * const decryptedData = CryptoService.decryptAES(encryptedResult, encryptionKey);
   * console.log(decryptedData); // Output: 'my secret data'
   * ```
   */
  public static decryptAES(encryptedPayload: IAesEncrypted, key: Buffer): string {
    if (key.length !== this.AES_KEY_LENGTH) {
      throw new Error(`Invalid AES key length. Expected ${this.AES_KEY_LENGTH} bytes.`);
    }

    const iv: Buffer = Buffer.from(encryptedPayload.iv, 'hex');
    const encryptedData: Buffer = Buffer.from(encryptedPayload.encryptedData, 'hex');
    const authTag: Buffer = Buffer.from(encryptedPayload.authTag, 'hex');

    const decipher: DecipherGCM = createDecipheriv(this.AES_ALGO, key, iv);
    decipher.setAuthTag(authTag); // Set the authentication tag BEFORE calling update/final

    const decrypted: Buffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * @description Generates a new RSA (Rivest–Shamir–Adleman) public and private key pair.
   * RSA is an asymmetric encryption algorithm commonly used for secure key exchange,
   * digital signatures, and encrypting small amounts of data. The generated keys
   * are returned in PEM (Privacy Enhanced Mail) format, which is a widely accepted
   * standard for storing cryptographic keys.
   *
   * @public
   * @static
   * @method generateRsaKeyPair
   * @param {number} [keySize=2048] The modulus length of the RSA key in bits.
   * Common and recommended sizes include 2048, 3072, or 4096 bits. Larger key sizes
   * provide stronger cryptographic security but come with increased computational
   * overhead for generation, encryption, and decryption operations.
   * @returns {IRsaKeyPair} An object containing the `publicKey` and `privateKey`
   * as PEM encoded strings. The public key can be shared, while the private key
   * must be kept strictly confidential.
   * @example
   * ```typescript
   * // Generate a 2048 bit RSA key pair (default)
   * const rsaKeysDefault = CryptoService.generateRsaKeyPair();
   * console.log('Default Public Key:', rsaKeysDefault.publicKey.substring(0, 50) + '...');
   * console.log('Default Private Key:', rsaKeysDefault.privateKey.substring(0, 50) + '...');
   *
   * // Generate a 3072 bit RSA key pair
   * const rsaKeys3072 = CryptoService.generateRsaKeyPair(3072);
   * console.log('3072-bit Public Key:', rsaKeys3072.publicKey.substring(0, 50) + '...');
   * ```
   */
  public static generateRsaKeyPair(keySize: number = 2048): IRsaKeyPair {
    return generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: {
        type: 'spki', // Subject Public Key Info (standard X.509 format)
        format: 'pem', // Privacy Enhanced Mail format
      },
      privateKeyEncoding: {
        type: 'pkcs8', // Public Key Cryptography Standards #8 (standard for private keys)
        format: 'pem', // Privacy Enhanced Mail format
      },
    });
  }

  /**
   * @description Encrypts string data using an RSA public key.
   * Data encrypted with a public key can only be decrypted by the corresponding
   * private key. **Important Note**: RSA encryption is generally suitable only
   * for small amounts of data (e.g., symmetric keys, hashes) due to its inherent
   * computational overhead and strict limitations on the maximum data size it can
   * encrypt directly. For large data, it's recommended to encrypt the data with
   * a symmetric key (e.g., AES) and then encrypt that symmetric key with RSA.
   *
   * @public
   * @static
   * @method encryptRSA
   * @param {string} data The string data to be encrypted. This data should be
   * relatively small, typically a symmetric key or a hash.
   * @param {string | Buffer | KeyObject} publicKey The RSA public key. This can be
   * a PEM encoded string, a Node.js `Buffer` containing the key, or a `KeyObject`
   * instance.
   * @returns {string} The encrypted data encoded as a base64 string.
   * @example
   * ```typescript
   * const { publicKey } = CryptoService.generateRsaKeyPair();
   * const messageToEncrypt = 'Hello RSA!';
   * const encryptedMessage = CryptoService.encryptRSA(messageToEncrypt, publicKey);
   * console.log(encryptedMessage); // Output: e.g., 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789+/=' (base64 string)
   * ```
   */
  public static encryptRSA(data: string, publicKey: string | Buffer | KeyObject): string {
    const dataBuffer = Buffer.from(data, 'utf8');
    const encrypted = publicEncrypt(publicKey, dataBuffer);
    return encrypted.toString('base64'); // Base64 is commonly used for transporting binary encrypted data
  }

  /**
   * @description Decrypts base64 encoded data that was previously encrypted using an
   * RSA public key, by utilizing the corresponding RSA private key.
   * This method completes the asymmetric encryption cycle. The private key must be
   * kept absolutely confidential to ensure the security of the decrypted data.
   *
   * @public
   * @static
   * @method decryptRSA
   * @param {string} encryptedData The base64 encoded string of the encrypted data,
   * as originally returned by the `encryptRSA` method.
   * @param {string | Buffer | KeyObject} privateKey The RSA private key. This can be
   * a PEM encoded string, a Node.js `Buffer` containing the key, or a `KeyObject`
   * instance. This key must be kept strictly confidential.
   * @returns {string} The original plaintext data as a UTF 8 string.
   * @example
   * ```typescript
   * const { publicKey, privateKey } = CryptoService.generateRsaKeyPair();
   * const originalMessage = 'Hello RSA!';
   * const encryptedMessage = CryptoService.encryptRSA(originalMessage, publicKey);
   * const decryptedMessage = CryptoService.decryptRSA(encryptedMessage, privateKey);
   * console.log(decryptedMessage); // Output: 'Hello RSA!'
   * ```
   */
  public static decryptRSA(encryptedData: string, privateKey: string | Buffer | KeyObject): string {
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const decrypted = privateDecrypt(privateKey, encryptedBuffer);
    return decrypted.toString('utf8');
  }
}
