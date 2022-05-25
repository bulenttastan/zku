// TODO: Import necessary libraries. Check cargo.toml and the documentation of the libraries.
use ark_bls12_381::Fq;
use ndarray::Array2;

struct Freivald {
    x: Array2<Fq>, // Array/Vec of Fq,
}

impl Freivald {
    // TODO: Create constructor for object
    fn new(array_size: usize) -> Self {
        assert!(array_size > 0);

        // Generate random number
        let r = rand::random::<Fq>();

        // Populate vector with values r^i for i=0..matrix_size
        let mut x = Array2::<Fq>::ones((array_size, 1));
        for i in 1..array_size {
            x[[i, 0]] = x[[i-1, 0]] * r;
        }

        // Return freivald value with this vector as its x value
        Freivald { x }
    }



    // TODO: Add proper types to input matrices. Remember matrices should hold Fq values
    fn verify(&self, matrix_a: &Array2::<Fq>, matrix_b: &Array2::<Fq>, supposed_ab: &Array2::<Fq>) -> bool {
        assert!(check_matrix_dimensions(matrix_a, matrix_b, supposed_ab));
        // TODO: check if a * b * x == c * x. Check algorithm to make sure order of operations are correct
        let lhs = matrix_a.dot(&matrix_b.dot(&self.x));
        let rhs = supposed_ab.dot(&self.x);

        // Check if the matrix multiplication on the left is same as the right
        lhs == rhs
    }

    // utility function to not have to instantiate Freivalds if you just want to make one
    // verification.
    // TODO: Add types for arguments
    fn verify_once(matrix_a: &Array2::<Fq>, matrix_b: &Array2::<Fq>, supposed_ab: &Array2::<Fq>) -> bool {
        let freivald = Freivald::new(supposed_ab.nrows());
        freivald.verify(matrix_a, matrix_b, supposed_ab)
    }
}
// TODO: [Bonus] Modify code to increase your certainty that A * B == C by iterating over the protocol.
// Note that you need to generate new vectors for new iterations or you'll be recomputing same
// value over and over. No problem in changing data structures used by the algorithm (currently its a struct
// but that can change if you want to)


// You can either do a test on main or just remove main function and rename this file to lib.rs to remove the
// warning of not having a main implementation
fn main() {}

// TODO: Add proper types to input matrices. Remember matrices should hold Fq values
pub fn check_matrix_dimensions(matrix_a: &Array2::<Fq>, matrix_b: &Array2::<Fq>, supposed_ab: &Array2::<Fq>) -> bool {
    // TODO: Check if dimensions of making matrix_a * matrix_b matches values in supposed_ab.
    if matrix_a.ncols() == matrix_b.nrows() // # of columns in A should be same as # of rows in B for multiplication
        && matrix_a.nrows() == supposed_ab.nrows() // # of rows in A and C should be same
        && matrix_b.ncols() == supposed_ab.ncols() // # of columns in B and C should be same
    {
        return true;
    }
    // If it doesn't you know its not the correct result independently of matrix contents
    return false;
}

pub fn random_matrix(size: usize) -> Array2::<Fq> {
    let mut m = Array2::<Fq>::ones((size, size));
    for i in 0..size {
        for j in 0..size {
            m[[i, j]] = m[[i, j]] * rand::random::<Fq>();
        }
    }
    m
}

pub fn matrix_square(m: &Array2::<Fq>) -> Array2::<Fq> { m.dot(m) }

#[cfg(test)]
mod tests {
    // #[macro_use]
    use lazy_static::lazy_static;
    use rstest::rstest;

    use super::*;

    lazy_static! {
        static ref MATRIX_A: Array2::<Fq> = random_matrix(200);
        static ref MATRIX_A_DOT_A: Array2::<Fq> = matrix_square(&MATRIX_A);
        static ref MATRIX_B: Array2::<Fq> = random_matrix(200);
        static ref MATRIX_B_DOT_B: Array2::<Fq> = matrix_square(&MATRIX_B);
        static ref MATRIX_C: Array2::<Fq> = random_matrix(200);
        static ref MATRIX_C_DOT_C: Array2::<Fq> = matrix_square(&MATRIX_C);
    }

    #[rstest]
    #[case(&MATRIX_A, &MATRIX_A, &MATRIX_A_DOT_A)]
    #[case(&MATRIX_B, &MATRIX_B, &MATRIX_B_DOT_B)]
    #[case(&MATRIX_C, &MATRIX_C, &MATRIX_C_DOT_C)]
    fn freivald_verify_success_test(
        #[case] matrix_a: &Array2::<Fq>,
        #[case] matrix_b: &Array2::<Fq>,
        #[case] supposed_ab: &Array2::<Fq>,
    ) {
        let freivald = Freivald::new(supposed_ab.nrows());
        assert!(freivald.verify(matrix_a, matrix_b, supposed_ab));
    }

    #[rstest]
    #[case(&MATRIX_A, &MATRIX_B, &MATRIX_A_DOT_A)]
    #[case(&MATRIX_B, &MATRIX_A, &MATRIX_B_DOT_B)]
    #[case(&MATRIX_C, &MATRIX_B, &MATRIX_C_DOT_C)]
    fn freivald_verify_fail_test(
        #[case] a: &Array2::<Fq>,
        #[case] b: &Array2::<Fq>,
        #[case] c: &Array2::<Fq>,
    ) {
        let freivald = Freivald::new(c.nrows());
        assert!(!freivald.verify(a, b, c));
    }

    // [Bonus] Verify multiple times to increase certainty
    #[rstest]
    #[case(&MATRIX_A, &MATRIX_A, &MATRIX_A_DOT_A)]
    #[case(&MATRIX_B, &MATRIX_B, &MATRIX_B_DOT_B)]
    #[case(&MATRIX_C, &MATRIX_C, &MATRIX_C_DOT_C)]
    fn freivald_verify_increased_certainty_success_test(
        #[case] matrix_a: &Array2::<Fq>,
        #[case] matrix_b: &Array2::<Fq>,
        #[case] supposed_ab: &Array2::<Fq>,
    ) {
        // Error bound is 1/2^k if we iterate k times: k=10 gives 99.9% certainty
        for _ in 0..10 {
            assert!(Freivald::verify_once(matrix_a, matrix_b, supposed_ab));
        }
    }
}
