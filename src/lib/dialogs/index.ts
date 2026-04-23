/**
 * Dialogs utility - Centralizado para permitir alert/confirm/prompt
 * con eslint-disable localizado
 */

 
export const showAlert = (message: string): void => alert(message);

export const showConfirm = (message: string): boolean => confirm(message);

export const showPrompt = (message: string, defaultValue?: string): string | null => prompt(message, defaultValue);
 
