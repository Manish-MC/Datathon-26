from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hash_val = "$2b$12$nnXnj/XCUe6ou9YRJIrpoOx0aWgrJmNIIyzwwxGaQCKF/LHTlcGRG"
passwords_to_test = ["PC_10452_2015", "password", "password123", "admin", "123456", "PC_10452_2015@123", "ksp_1709"]

print(f"Hash: {hash_val}")
for p in passwords_to_test:
    res = pwd_context.verify(p, hash_val)
    print(f"Password '{p}': {res}")
