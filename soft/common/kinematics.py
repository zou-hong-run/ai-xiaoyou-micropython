
import math
# 四舍五入
def round_half_up(n):
    if n >= 0:
        return math.floor(n + 0.5)
    else:
        return math.ceil(n - 0.5)


# 逆解
def inverse_kinematics(x, y, thigh_length=5.7, calf_length=6.4):
    if x == 0 and y == 0:
        return
    angle2 = math.pi - math.acos(
        (x**2 + y**2 - thigh_length**2 - calf_length**2)
        / (-2 * thigh_length * calf_length)
    )
    alpha = math.acos(
        (x**2 + y**2 + thigh_length**2 - calf_length**2)
        / (2 * thigh_length * math.sqrt(x**2 + y**2))
    )
    #  angle1 = abs(math.atan(y / x)) - alpha
    if x > 0:
        angle1 = abs(math.atan(y / x)) - alpha
    elif x < 0:
        angle1 = math.pi - abs(math.atan(y / x)) - alpha
    else:
        angle1 = math.pi - math.pi / 2 - alpha
    deg2 = math.degrees(angle2)
    deg1 = math.degrees(angle1)
    return (round_half_up(deg1)), (round_half_up(deg2))


# 正解
def forward_kinematics(theta1, theta2, thigh_length=5.7, calf_length=6.4):
    # Convert angles from degrees to radians
    theta1_rad = math.radians(theta1)
    theta2_rad = math.radians(theta2)

    # Calculate the position of the foot in Cartesian coordinates
    x = thigh_length * math.cos(theta1_rad) + calf_length * math.cos(
        theta1_rad + theta2_rad
    )
    y = thigh_length * math.sin(theta1_rad) + calf_length * math.sin(
        theta1_rad + theta2_rad
    )

    return (round_half_up(x)), (round_half_up(y))