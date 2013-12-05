class Organization < Sequel::Model
  one_to_many :users  

  def db_size_in_bytes
    users.map(&:db_size_in_bytes).sum
  end

  def assigned_quota
    users_dataset.sum(:quota_in_bytes)
  end

  def unassigned_quota
    quota_in_bytes - assigned_quota
  end
end
