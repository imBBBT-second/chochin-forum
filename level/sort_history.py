import json
import os

# 정렬할 파일 목록
target_files = ["classic.json", "challenge.json", "platformer.json"]

def sort_history():
    # 스크립트가 위치한 디렉토리 기준
    base_dir = os.path.dirname(os.path.abspath(__file__))

    for filename in target_files:
        file_path = os.path.join(base_dir, filename)
        
        if not os.path.exists(file_path):
            print(f"파일을 찾을 수 없습니다: {filename}")
            continue

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if "history" in data and isinstance(data["history"], list):
                # 시간 순서대로 정렬 (문자열 비교: ISO 8601 형식은 사전순 정렬이 시간순과 일치함)
                data["history"].sort(key=lambda x: x.get("time", ""))
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                print(f"{filename}의 history가 시간 순서대로 정렬되었습니다.")
            else:
                print(f"{filename}에 history 항목이 없습니다.")

        except Exception as e:
            print(f"{filename} 처리 중 오류 발생: {e}")

if __name__ == "__main__":
    sort_history()