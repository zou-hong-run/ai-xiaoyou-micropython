def parse_query_string(query_string):
    # 创建一个空字典来存储解析的结果
    params = {}
    
    # 分割查询字符串，以 '&' 为分隔符
    pairs = query_string.split('&')
    
    # 遍历每一对键值对
    for pair in pairs:
        # 分割每个键值对，以 '=' 为分隔符
        key, value = pair.split('=')
        
        # 尝试将值转换为整数，如果无法转换则保留原值
        try:
            value = int(value)
        except ValueError:
            pass  # 如果转换失败，值将保留为字符串
        
        # 将键和值添加到字典中
        params[key] = value
    
    return params