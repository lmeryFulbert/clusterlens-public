/*  
export function formatBytes(bytes) {
    const gb = 1024 ** 3;
    const tb = 1024 ** 4;
  
    if (bytes >= tb) return `${(bytes / tb).toFixed(2)} To`;
    return `${(bytes / gb).toFixed(1)} Go`;
  }
*/

export function formatBytes(bytes) {
    const tb = 1024 ** 4;
    const gb = 1024 ** 3;
  
    if (bytes >= tb) {
      return `${(bytes / tb).toFixed(2)} Tio`;
    }
  
    return `${(bytes / gb).toFixed(1)} Gio`;
  }