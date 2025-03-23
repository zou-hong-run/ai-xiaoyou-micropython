from machine import SoftI2C,Pin
from lib.servo import Servos
import time
# 驱动舵机
sda = Pin(21)
scl = Pin(22)
i2c = SoftI2C(sda=sda,scl=scl)
servo = Servos(i2c=i2c)

# positions 列表中的值是舵机的编号
positions = [0, 2, 4, 6, 8, 10, 12, 14]

def control_servo(index, angle):
    if 0 <= index < len(positions):
        degrees = 0
        if index==0:
            degrees = 180-angle
        elif index==1:
            degrees = angle
        elif index==2:
            degrees = 180-angle
        elif index==3:
            degrees = angle
        elif index==4:
            degrees = angle
        elif index==5:
            degrees = 180-angle
        elif index==6:
            degrees = angle
        elif index==7:
            degrees = 180-angle
        servo.position(index=positions[index], degrees=degrees)
    else:
        print("Index out of range")



# 补间运动
def move_leg(start_angles, end_angles, steps=10):
    theta1_start, theta2_start = start_angles
    theta1_end, theta2_end = end_angles
    print(3)
    for i in range(steps):
        # Linear interpolation
        theta1 = theta1_start + (theta1_end - theta1_start) * i / (steps - 1)
        theta2 = theta2_start + (theta2_end - theta2_start) * i / (steps - 1)
        control_servo(0,theta1)
        control_servo(1,theta2)
        
        control_servo(2,theta1)
        control_servo(3,theta2)
        
        control_servo(4,theta1)
        control_servo(5,theta2)
        
        control_servo(6,theta1)
        control_servo(7,theta2)
        # Add a delay to simulate movement
        time.sleep(0.05)

def move_legs_line(start_angles, end_angles, leg_indices, steps=10):
    """
    # 使用示例
    start_angles = [
        (0, 0),   # 第一条腿起始角度
        (0, 0),   # 第二条腿起始角度
        (0, 0),   # 第三条腿起始角度
        (0, 0)    # 第四条腿起始角度
    ]
    end_angles = [
        (90, 90), # 第一条腿结束角度
        (90, 90), # 第二条腿结束角度
        (90, 90), # 第三条腿结束角度
        (90, 90)  # 第四条腿结束角度
    ]
    # 移动四条腿
    move_legs(start_angles, end_angles, [0, 1, 2, 3])

    """
    for leg_index in leg_indices:
        theta1_start, theta2_start = start_angles[leg_index]
        theta1_end, theta2_end = end_angles[leg_index]
        
        for i in range(steps):
            # Linear interpolation
            theta1 = theta1_start + (theta1_end - theta1_start) * i / (steps - 1)
            theta2 = theta2_start + (theta2_end - theta2_start) * i / (steps - 1)
            
            control_servo(leg_index * 2, theta1)     # 偶数索引对应 theta1
            control_servo(leg_index * 2 + 1, theta2) # 奇数索引对应 theta2
            
            # Add a delay to simulate movement
            time.sleep(0.05)
def move_legs(start_angles, end_angles, leg_indices, steps=5):
    for i in range(steps):
        for leg_index in leg_indices:
            theta1_start, theta2_start = start_angles[leg_index]
            theta1_end, theta2_end = end_angles[leg_index]
            
            # 线性插值
            theta1 = theta1_start + (theta1_end - theta1_start) * i / (steps - 1)
            theta2 = theta2_start + (theta2_end - theta2_start) * i / (steps - 1)

            control_servo(leg_index * 2, theta1)     # 偶数索引对应 theta1
            control_servo(leg_index * 2 + 1, theta2) # 奇数索引对应 theta2
        
        # 添加延迟以模拟运动
        time.sleep(0.02)

