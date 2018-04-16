/**
 * Original alrgorithm from:
 * https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
 * 
 * Inspired by weighted Levenshtein algorithm from:
 * https://stackoverflow.com/questions/22308014/damerau-levenshtein-distance-implementation
 * 
 * And Damerau piece from:
 * https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
 * 
 * And a few edits myself
 * 
 * Levenshtein Distance calculates the number of substitutions,
 * insertions, or deletions that need to happen for two strings to be
 * equal
 * 
 * @param {string} a 
 * @param {string} b 
 * @returns {number} - Levenshtein Distance
 */
function getEditDistance(a, b) {
    // trim whitespace from beginning / end of each string
    a = a.trim(); b = b.trim();

    // fail early if either param is not a String
    if (typeof(a) !== 'string' || typeof(b) !== 'string') return -1;

    // handle empty strings
    if (a.length === 0) return b.length; 
    if (b.length === 0) return a.length;

    // set up distance matrix
    let matrix = [];

    // set up weights obj
    let weights = {
        insert: 1,
        delete: 1,
        replace: 0.5
    };
  
    // initialize first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [weights.insert * i];
    }
  
    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = (weights.delete * j);
    }
  
    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if ( b.charAt(i-1) == a.charAt(j-1) ) {
                matrix[i][j] = matrix[i-1][j-1];
            }
            
            else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + weights.replace, // substitution
                    matrix[ i ][j-1] + weights.insert, // insertion
                    matrix[i-1][ j ] + weights.delete  // deletion
                );
            }
        }
    }
    
    console.log(matrix);

    return matrix[b.length][a.length];
};