/**
 * Original alrgorithm from: https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
 * 
 * Levenshtein Distance calculates the number of substitutions, insertions, or deletions that need to happen for two strings to be equal
 * 
 * @param {string} a 
 * @param {string} b 
 * @returns {number} - Levenshtein Distance
 */
function getEditDistance(a, b) {
    // fail early if either param is not a String
    if (typeof(a) !== 'string' || typeof(b) !== 'string') return -1;

    // handle empty strings
    if (a.length === 0) return b.length; 
    if (b.length === 0) return a.length;
  
    var matrix = [];
  
    // initialize first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
  
    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
  
    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if ( b.charAt(i-1) == a.charAt(j-1) ) {
                matrix[i][j] = matrix[i-1][j-1];
            }
            
            else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1, // substitution
                    matrix[ i ][j-1] + 1, // insertion
                    matrix[i-1][ j ] + 1  // deletion
                );
            }
        }
    }
  
    return matrix[b.length][a.length];
};