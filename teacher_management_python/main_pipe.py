import os
from data_processing import process_teaching_text
from assess import TeachingAssessor
from report import generate_fancy_report
from prompt import TeachingPrompts

def main():
    # 현재 스크립트의 디렉토리를 기준으로 상대 경로 설정
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(current_dir, 'data', '실제줌강의기반텍스트추출.txt')
    output_file = os.path.join(current_dir, 'data', 'teaching_report_v10.md')

    # 과외 녹화 텍스트 파일 읽기
    with open(input_file, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    # 데이터 전처리
    processed_data = process_teaching_text(raw_text)
    print("처리된 데이터:", processed_data)  # 데이터 확인용 로그

    # 평가 수행
    assessor = TeachingAssessor()
    assessment_result = assessor.assess_teaching(processed_data)

    # 리포트 생성
    report_md = generate_fancy_report(assessment_result)

    # 리포트 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report_md)

    print(f"리포트가 '{output_file}' 파일로 저장되었습니다.")

if __name__ == "__main__":
    main()