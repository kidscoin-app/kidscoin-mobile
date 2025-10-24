/**
 * Utilitários para AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Salva item no storage
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Erro ao salvar no storage:', error);
    throw error;
  }
};

/**
 * Recupera item do storage
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Erro ao recuperar do storage:', error);
    return null;
  }
};

/**
 * Remove item do storage
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Erro ao remover do storage:', error);
    throw error;
  }
};

/**
 * Salva múltiplos itens
 */
export const setMultiple = async (
  items: Array<[string, string]>
): Promise<void> => {
  try {
    await AsyncStorage.multiSet(items);
  } catch (error) {
    console.error('Erro ao salvar múltiplos itens:', error);
    throw error;
  }
};

/**
 * Remove múltiplos itens
 */
export const removeMultiple = async (keys: string[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Erro ao remover múltiplos itens:', error);
    throw error;
  }
};

/**
 * Limpa todo o storage
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
    throw error;
  }
};

/**
 * Salva objeto como JSON
 */
export const setObject = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await setItem(key, jsonValue);
  } catch (error) {
    console.error('Erro ao salvar objeto:', error);
    throw error;
  }
};

/**
 * Recupera objeto do JSON
 */
export const getObject = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Erro ao recuperar objeto:', error);
    return null;
  }
};
