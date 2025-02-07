import csv
import psycopg2

# Database connection settings
DATABASE_HOST = 'aws-0-ap-southeast-1.pooler.supabase.com'
DATABASE_NAME = 'postgres'
DATABASE_USER = 'postgres.mleafifpiappqhuhyucp'
DATABASE_PASSWORD = 'Alyssa7719!!'

# File path to your CSV
csv_file = '15Voucher.csv'

# Insert vouchers from CSV
try:
    conn = psycopg2.connect(
        host=DATABASE_HOST,
        dbname=DATABASE_NAME,
        user=DATABASE_USER,
        password=DATABASE_PASSWORD
    )
    cursor = conn.cursor()

    with open(csv_file, 'r') as file:
        reader = csv.reader(file)
        #next(reader)  # Skip header row
        for row in reader:
            amount, voucher_code = row
            cursor.execute("INSERT INTO vouchers (amount, voucher_code) VALUES (%s, %s)", (int(amount), voucher_code))

    conn.commit()
    cursor.close()
    conn.close()
    print("Voucher codes imported successfully!")
except Exception as e:
    print("Error importing vouchers:", e)
