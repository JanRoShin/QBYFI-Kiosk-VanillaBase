from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit
from escpos.printer import Usb
import OPi.GPIO as GPIO
import time
import csv
import json
import os
from datetime import datetime 
import psycopg2
import atexit

@atexit.register
def cleanup():
    try:
        GPIO.remove_event_detect(COIN_SENSOR_PIN)
        GPIO.cleanup()
    except:
        pass

app = Flask(__name__)
socketio = SocketIO(app)

GPIO.setmode(GPIO.BOARD)

VENDOR_ID = 0x20d1
PRODUCT_ID = 0x7009

# Initialize the printer object
printer = Usb(VENDOR_ID, PRODUCT_ID)

COIN_SENSOR_PIN = 3  # GPIO pin connected to the coin acceptor
ENABLE_PIN = 7

coin_count = 0  # Total value of coins inserted
pulse_count = 0  # To count pulses for determining coin type
last_pulse_time = time.time()  # Tracks the time of the last pulse

# Database connection settings
DATABASE_HOST = 'aws-0-ap-southeast-1.pooler.supabase.com'
DATABASE_NAME = 'postgres'
DATABASE_USER = 'postgres.mleafifpiappqhuhyucp'
DATABASE_PASSWORD = 'Alyssa7719!!'

# Establish a connection to the PostgreSQL database
def get_db_connection():
    conn = psycopg2.connect(
        host=DATABASE_HOST,
        dbname=DATABASE_NAME,
        user=DATABASE_USER,
        password=DATABASE_PASSWORD
    )
    return conn

# Load vouchers from the database
def load_vouchers():
    vouchers = {}
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT amount, voucher_code FROM vouchers")
        rows = cursor.fetchall()

        for row in rows:
            amount, voucher_code = row
            if amount in vouchers:
                vouchers[amount].append(voucher_code)
            else:
                vouchers[amount] = [voucher_code]
        
        cursor.close()
        conn.close()

    except Exception as e:
        print("Error loading vouchers:", e)
    
    return vouchers

# Save vouchers to the database
def save_vouchers(vouchers):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Remove existing entries
        cursor.execute("DELETE FROM vouchers")

        # Insert updated vouchers into the database
        for amount, codes in vouchers.items():
            for code in codes:
                cursor.execute("INSERT INTO vouchers (amount, voucher_code) VALUES (%s, %s)", (amount, code))

        conn.commit()
        cursor.close()
        conn.close()

    except Exception as e:
        print("Error saving vouchers:", e)

# Print the total count of vouchers per amount
def print_voucher_totals(vouchers):
    print("Available vouchers:")
    for amount, codes in vouchers.items():
        print(f"{amount} pesos: {len(codes)}")
    print()

# Log voucher use
def log_voucher_use(amount, voucher_code):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        current_date = datetime.now().strftime("%Y-%m-%d")
        current_time = datetime.now().strftime("%H:%M:%S")
        kioskName = "Market1"

        cursor.execute("INSERT INTO logs (date, time, amount, voucher_code, kiosk_name) VALUES (%s, %s, %s, %s, %s)", 
                       (current_date, current_time, amount, voucher_code, kioskName))

        conn.commit()
        cursor.close()
        conn.close()

        print("Log entry added:", {'date': current_date, 'time': current_time, 'amount': amount, 'voucher_code': voucher_code, 'kioskName':kioskName})

    except Exception as e:
        print("Error logging voucher use:", e)

def coin_inserted():
    global last_pulse_time, pulse_count, coin_count
    current_time = time.time()
    pulse_count += 1
    last_pulse_time = current_time

# Set up the GPIO pin for the coin sensor
GPIO.setup(COIN_SENSOR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(ENABLE_PIN, GPIO.OUT)
GPIO.output(ENABLE_PIN, GPIO.LOW)

# Add event detection for coin insertion
GPIO.add_event_detect(COIN_SENSOR_PIN, GPIO.RISING, callback=coin_inserted, bouncetime=50)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('start_coin_acceptance')
def start_coin_acceptance():
    global pulse_count, coin_count, last_pulse_time
    
    # Remove existing event detection if it exists
    try:
        GPIO.remove_event_detect(COIN_SENSOR_PIN)
    except:
        pass
        
    # Add new event detection
    GPIO.add_event_detect(COIN_SENSOR_PIN, GPIO.RISING, callback=coin_inserted, bouncetime=50)
    

    GPIO.output(ENABLE_PIN, GPIO.HIGH)
    print("Waiting for coins to be inserted...")
    emit('message', {'status': 'Coin acceptance started'})

    try:
        while True:
            current_time = time.time()
            if pulse_count > 0 and current_time - last_pulse_time > 0.5:
                if pulse_count == 1:
                    coin_value = 1
                    print("1 peso inserted")
                elif pulse_count == 5:
                    coin_value = 5
                    print("5 peso inserted")
                elif pulse_count == 10:
                    coin_value = 10
                    print("10 peso inserted")
                elif pulse_count == 20:
                    coin_value = 20
                    print("20 peso inserted")
                else:
                    coin_value = 0

                coin_count += coin_value
                print(f"Current total: {coin_count} pesos")

                pulse_count = 0

                emit('coin_update', {'coin_count': coin_count}, broadcast=True)
                
               # Enable buttons based on the total coin count
                emit('update_buttons', {'coin_count': coin_count})

            socketio.sleep(0.1)

    except KeyboardInterrupt:
        GPIO.cleanup()

    return jsonify({'message': 'Coin acceptance completed', 'coin_count': coin_count})

@socketio.on('voucher_button_click')
def voucher_button_click(amount, duration):
    global coin_count
    print(f"Amount received: {amount} pesos")
    print(f"Current coin count: {coin_count} pesos")
    
    # Fetch available vouchers from the database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT voucher_code FROM vouchers WHERE amount = %s LIMIT 1", (amount,))
    result = cursor.fetchone()

    if result:
        voucher_code = result[0]
        # Log the voucher use
        log_voucher_use(amount, voucher_code)
        cursor.execute("DELETE FROM vouchers WHERE voucher_code = %s", (voucher_code,))
        conn.commit()

        print(f"Dispensing voucher code: {voucher_code}")
        
        
        
        # Print updated voucher totals
        vouchers = load_vouchers()
        print_voucher_totals(vouchers)
        
        # Print voucher code
        printer.set_with_default()
        printer.set(double_width=True)
        printer.text(f"Amount: Php {amount}.00\n")
        printer.text(f"Duration: {duration}\n")
        printer.text(f"Voucher Code:\n")
        printer.ln()
        printer.set(double_width=True, double_height=True, align='center', bold=True)
        printer.text(voucher_code)
        printer.cut(mode='PART')

        # Reset coin count and pulse count
        if amount > 0:
            coin_count -= amount
			
        emit('voucher_dispensed', {'coin_count': coin_count})
        emit('message', {'status': 'Please get your voucher code'})

        if coin_count == 0:
            GPIO.output(ENABLE_PIN, GPIO.LOW)
            emit('reset_ui', {'coin_count': coin_count})
        else:
            emit('coin_update', {'coin_count': coin_count}, broadcast=True)
            emit('update_buttons', {'coin_count': coin_count})
    else:
        emit('voucher_dispensed', {'voucher_code': 'No vouchers available for this amount'})
        print("No vouchers available for this amount.")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        socketio.run(app, host="0.0.0.0", port=5001, debug=True, allow_unsafe_werkzeug=True)
    finally:
        cleanup()  # Add this line