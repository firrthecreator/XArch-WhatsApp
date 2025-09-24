/**
 * @file CryptoService.test.ts
 * @description A comprehensive test suite for the `CryptoService` class.
 * This suite uses Jest to verify that all cryptographic functions, including hashing,
 * key generation, and symmetric and asymmetric encryption, perform correctly and securely.
 * The tests ensure that methods are deterministic where expected and that
 * they correctly handle valid and invalid inputs.
 */

/**
 * @description Imports the `CryptoService` class, which is the subject of these tests.
 */
import { CryptoService } from '../../src/libs/CryptoService';

/**
 * @description Imports the `Buffer` class from the `node:buffer` module.
 * This is essential for handling binary data, which is heavily used
 * in cryptographic operations and their test cases.
 */
import { Buffer } from 'node:buffer';

/**
 * @description Imports the `IAesEncrypted` type, used for type checking
 * the encrypted payload object in the AES tests.
 */
import { type IAesEncrypted } from '../../src/types/libs/CryptoService';

/**
 * @describe The main test suite for the `CryptoService` class.
 * This block contains all the test cases, organized into nested suites
 * for logical grouping of related functionalities.
 */
describe('CryptoService', () => {
  /**
   * @describe A nested test suite for hashing and HMAC functionalities.
   * This section verifies that the hashing and HMAC functions are consistent and
   * produce the expected output for a given input.
   */
  describe('Hashing and HMAC', () => {
    const data = 'hello world';

    /**
     * @test
     * @description Verifies that the `hash` method generates a consistent and
     * deterministic SHA 256 hash. This is tested by hashing the same data twice
     * and asserting that the outputs are identical.
     */
    it('should generate a consistent SHA-256 hash', () => {
      const hash1 = CryptoService.hash(data);
      const hash2 = CryptoService.hash(data);
      expect(hash1).toBe(hash2);
      expect(hash1).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    /**
     * @test
     * @description Verifies that the `hmac` method generates a consistent
     * and deterministic HMAC for a given data and key. This is a crucial
     * property for message authenticity verification.
     */
    it('should generate a consistent HMAC', () => {
      const key = 'secret-key';
      const hmac1 = CryptoService.hmac(data, key);
      const hmac2 = CryptoService.hmac(data, key);
      expect(hmac1).toBe(hmac2);
      expect(hmac1).toBe('095d5a21fe6d0646db223fdf3de6436bb8dfb2fab0b51677ecf6441fcf5f2a67');
    });
  });

  /**
   * @describe A nested test suite for random generation and key derivation functions.
   * This section ensures that functions for generating random bytes, keys, and salts
   * behave as expected, with correct types and lengths.
   */
  describe('Random Generation and Key Derivation', () => {
    /**
     * @test
     * @description Verifies that the `generateRandomBytes` method returns a `Buffer`
     * of the exact length requested.
     */
    it('should generate random bytes of a specified length', () => {
      const bytes = CryptoService.generateRandomBytes(64);
      expect(bytes).toBeInstanceOf(Buffer);
      expect(bytes.length).toBe(64);
    });

    /**
     * @test
     * @description Verifies that the `generateAesKey` method correctly generates
     * a 32-byte key, which is the standard length for AES 256 encryption.
     */
    it('should generate a 32-byte AES key', () => {
      const key = CryptoService.generateAesKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    /**
     * @test
     * @description Verifies that the `generateSalt` method correctly generates
     * a 16-byte salt, which is the recommended length for PBKDF2.
     */
    it('should generate a 16-byte salt', () => {
      const salt = CryptoService.generateSalt();
      expect(salt).toBeInstanceOf(Buffer);
      expect(salt.length).toBe(16);
    });

    /**
     * @test
     * @description Verifies that the `deriveKeyFromPassword` function is deterministic.
     * Given the same password and salt, it should always produce the same derived key,
     * and the key should have the correct length (32 bytes).
     */
    it('should derive a key from a password deterministically', () => {
      const password = 'my-strong-password';
      const salt = CryptoService.generateSalt();
      const key1 = CryptoService.deriveKeyFromPassword(password, salt);
      const key2 = CryptoService.deriveKeyFromPassword(password, salt);
      expect(key1).toEqual(key2);
      expect(key1.length).toBe(32);
    });
  });

  /**
   * @describe A nested test suite for the AES encryption and decryption methods.
   * This section ensures that data can be correctly encrypted and decrypted
   * and that the functions handle invalid inputs appropriately.
   */
  describe('AES Encryption/Decryption', () => {
    let key: Buffer;
    const plaintext = 'this is a secret message';

    /**
     * @beforeEach
     * @description A Jest hook that runs before each test case in this suite.
     * It generates a new, random AES key for each test to ensure they are
     * independent and isolated.
     */
    beforeEach(() => {
      key = CryptoService.generateAesKey();
    });

    /**
     * @test
     * @description Verifies the end to end functionality of AES encryption and decryption.
     * It checks that the encrypted data is not the same as the plaintext, that all
     * required components (IV and authentication tag) are present, and that the
     * decrypted data matches the original plaintext exactly.
     */
    it('should correctly encrypt and decrypt data in a roundtrip', () => {
      const encrypted: IAesEncrypted = CryptoService.encryptAES(plaintext, key);
      expect(encrypted.encryptedData).not.toBe(plaintext);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = CryptoService.decryptAES(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    /**
     * @test
     * @description Verifies that the `encryptAES` function throws an error when
     * an invalid key length is provided. This is a critical security check.
     */
    it('should throw an error when encrypting with an invalid key length', () => {
      const invalidKey = Buffer.from('this key is not 32 bytes long');
      expect(() => CryptoService.encryptAES(plaintext, invalidKey)).toThrow(
        'Invalid AES key length. Expected 32 bytes.',
      );
    });

    /**
     * @test
     * @description Verifies that the `decryptAES` function throws an error when
     * an invalid key length is provided. This prevents decryption with an
     * incorrectly sized key.
     */
    it('should throw an error when decrypting with an invalid key length', () => {
      const encrypted = CryptoService.encryptAES(plaintext, key);
      const invalidKey = Buffer.from('this key is also not 32 bytes');
      expect(() => CryptoService.decryptAES(encrypted, invalidKey)).toThrow(
        'Invalid AES key length. Expected 32 bytes.',
      );
    });
  });

  /**
   * @describe A nested test suite for RSA encryption and decryption methods.
   * This section ensures that RSA key pairs are correctly generated and that
   * data can be encrypted with a public key and decrypted with the corresponding
   * private key.
   */
  describe('RSA Encryption/Decryption', () => {
    /**
     * @test
     * @description Verifies that the `generateRsaKeyPair` method correctly generates
     * an RSA key pair and that the keys are in the expected PEM format, indicated
     * by their header and footer strings.
     */
    it('should generate a valid RSA key pair', () => {
      const keyPair = CryptoService.generateRsaKeyPair();
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    });

    /**
     * @test
     * @description Verifies the end to end functionality of RSA encryption and decryption.
     * It checks that data encrypted with the public key can be correctly decrypted
     * using the corresponding private key, and that the original message is recovered.
     */
    it('should correctly encrypt and decrypt data in a roundtrip', () => {
      const { publicKey, privateKey } = CryptoService.generateRsaKeyPair();
      const message = 'small secret data for RSA';
      const encrypted = CryptoService.encryptRSA(message, publicKey);
      expect(encrypted).not.toBe(message);

      const decrypted = CryptoService.decryptRSA(encrypted, privateKey);
      expect(decrypted).toBe(message);
    });
  });
});
